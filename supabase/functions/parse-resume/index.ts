import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const ParseResumeSchema = z.object({
  resumeUrl: z.string().url('Invalid resume URL format'),
  resumeAnalysisId: z.string().uuid('Invalid resume analysis ID format'),
  candidateId: z.string().uuid('Invalid candidate ID format'),
});

console.log('🚀 Edge Function parse-resume initializing...');

serve(async (req) => {
  console.log('🚀 parse-resume init - function started');
  console.log('📥 Received request:', req.method, req.url);
  
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      console.log('✅ CORS preflight handled');
      return new Response(null, { headers: corsHeaders });
    }

    // Handle GET request (health check)
    if (req.method === 'GET') {
      console.log('🏥 Health check requested');
      const affindaApiKey = Deno.env.get('AFFINDA_API_KEY');
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      return new Response(
        JSON.stringify({ 
          ok: true,
          hasApiKey: !!affindaApiKey,
          hasSupabaseUrl: !!supabaseUrl,
          hasSupabaseKey: !!supabaseKey,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Handle POST request (resume processing)
    if (req.method === 'POST') {
      const body = await req.json();
      
      // Validate input
      const validationResult = ParseResumeSchema.safeParse(body);
      if (!validationResult.success) {
        console.error('Input validation failed:', validationResult.error);
        return new Response(
          JSON.stringify({ 
            success: false,
            message: 'Dados de entrada inválidos',
            errors: validationResult.error.errors
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const { resumeUrl, resumeAnalysisId, candidateId } = validationResult.data;
      
      console.log('📄 Processing resume:', { 
        resumeUrl: resumeUrl.substring(0, 50) + '...', 
        resumeAnalysisId, 
        candidateId,
        hasResumeUrl: !!resumeUrl,
        hasAnalysisId: !!resumeAnalysisId,
        hasCandidateId: !!candidateId
      });

      const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
      const affindaApiKey = Deno.env.get('AFFINDA_API_KEY');

      console.log('🔑 Environment check:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        hasAffindaKey: !!affindaApiKey
      });

      const supabase = createClient(supabaseUrl, supabaseKey);

      if (!affindaApiKey) {
        console.warn('⚠️ AFFINDA_API_KEY not set, using fallback parsing');
        
        await supabase
          .from('resume_analyses')
          .update({
            processing_status: 'completed',
            extracted_data: {},
          })
          .eq('id', resumeAnalysisId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            parsedData: {},
            message: 'Resume uploaded but parser not configured'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate signed URL for private bucket
      console.log('🔐 Generating signed URL for resume access');
      const urlParts = new URL(resumeUrl);
      // Extract path after /storage/v1/object/ (handles both public and sign paths)
      const pathMatch = urlParts.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/resumes\/(.+)/);
      
      let fileUrlForAffinda = resumeUrl;
      
      if (pathMatch) {
        const filePath = pathMatch[1];
        console.log('📂 File path extracted:', filePath);
        
        const { data: signedData, error: signedError } = await supabase.storage
          .from('resumes')
          .createSignedUrl(filePath, 3600);

        if (signedError) {
          console.error('❌ Error creating signed URL:', signedError);
          throw new Error(`Failed to create signed URL: ${signedError.message}`);
        }

        if (signedData?.signedUrl) {
          fileUrlForAffinda = signedData.signedUrl;
          console.log('✅ Signed URL generated successfully');
          console.log('🔗 Signed URL (first 80 chars):', fileUrlForAffinda.substring(0, 80) + '...');
        } else {
          console.warn('⚠️ No signed URL returned, using original URL');
        }
      } else {
        console.warn('⚠️ Could not extract file path from URL, using original URL');
      }

      // Download file from Supabase and send binary to Affinda
      console.log('📄 Fazendo download do arquivo do Supabase...');
      const fileResponse = await fetch(fileUrlForAffinda);
      if (!fileResponse.ok) {
        throw new Error(`Erro ao baixar o PDF (${fileResponse.status})`);
      }

      const fileBlob = await fileResponse.blob();
      const formData = new FormData();
      formData.append("file", fileBlob, "resume.pdf");

      console.log('📤 Enviando arquivo binário para a Affinda API...');
      const affindaResponse = await fetch("https://api.affinda.com/v3/documents", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${affindaApiKey}`
        },
        body: formData
      });

      console.log('📥 Affinda response status:', affindaResponse.status);

      if (!affindaResponse.ok) {
        let errorText = '';
        try {
          errorText = await affindaResponse.text();
        } catch (e) {
          errorText = 'No error message available';
        }
        console.error('❌ Affinda API error (detailed):', affindaResponse.status, errorText.substring(0, 500));
        
        await supabase
          .from('resume_analyses')
          .update({
            processing_status: 'failed',
          })
          .eq('id', resumeAnalysisId);

        return new Response(
          JSON.stringify({ 
            success: false,
            message: 'Falha ao processar currículo. Por favor, tente novamente.'
          }),
          { 
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const affindaData = await affindaResponse.json();
      console.log('✅ Affinda retornou dados:', {
        fullName: affindaData.data?.name?.raw,
        email: affindaData.data?.emails?.[0],
        skills: affindaData.data?.skills?.length
      });

      // Extract relevant data from Affinda response
      const parsedData = {
        full_name: affindaData.data?.name?.raw || null,
        email: affindaData.data?.emails?.[0] || null,
        phone: affindaData.data?.phoneNumbers?.[0] || null,
        location: affindaData.data?.location?.formatted || null,
        date_of_birth: affindaData.data?.dateOfBirth || null,
        professional_summary: affindaData.data?.summary || null,
        work_experience: affindaData.data?.workExperience?.map((exp: any) => ({
          company: exp.organization || '',
          title: exp.jobTitle || '',
          start_date: exp.dates?.startDate || null,
          end_date: exp.dates?.endDate || null,
          current: exp.dates?.isCurrent || false,
          description: exp.jobDescription || null,
        })) || [],
        education: affindaData.data?.education?.map((edu: any) => ({
          institution: edu.organization || '',
          degree: edu.accreditation?.education || '',
          field: edu.accreditation?.educationLevel || null,
          start_date: edu.dates?.startDate || null,
          end_date: edu.dates?.completionDate || null,
          status: edu.dates?.isCurrent ? 'in_progress' : 'completed',
        })) || [],
        skills: affindaData.data?.skills?.map((skill: any) => skill.name).filter(Boolean) || [],
        languages: affindaData.data?.languages?.map((lang: any) => ({
          name: lang.name || '',
          proficiency: lang.proficiency || null,
        })) || [],
        certifications: affindaData.data?.certifications?.map((cert: any) => ({
          name: cert.name || '',
          issuer: cert.organization || null,
          issue_date: cert.date || null,
        })) || [],
        linkedin_url: affindaData.data?.websites?.find((w: any) => w.includes('linkedin'))?.url || null,
        github_url: affindaData.data?.websites?.find((w: any) => w.includes('github'))?.url || null,
        years_of_experience: affindaData.data?.totalYearsExperience || null,
      };

      console.log('Parsed data:', parsedData);

      // Update resume_analyses with parsed data
      const { error: updateError } = await supabase
        .from('resume_analyses')
        .update({
          processing_status: 'completed',
          extracted_data: parsedData,
          overall_score: 85, // Default score, can be calculated based on data completeness
        })
        .eq('id', resumeAnalysisId);

      if (updateError) {
        console.error('Error updating resume analysis:', updateError);
        throw updateError;
      }

      // Update candidate_profiles with parsed data
      const updateData: any = {
        full_name: parsedData.full_name || undefined,
        email: parsedData.email || undefined,
        phone: parsedData.phone || undefined,
        location: parsedData.location || undefined,
        date_of_birth: parsedData.date_of_birth || undefined,
        years_experience: parsedData.years_of_experience || undefined,
        education: parsedData.education,
        skills: parsedData.skills,
        languages: parsedData.languages,
      };

      // Set current position from work experience
      if (parsedData.work_experience && parsedData.work_experience.length > 0) {
        const currentOrLatest = parsedData.work_experience.find((exp: any) => exp.current) || parsedData.work_experience[0];
        updateData.current_position = currentOrLatest.title;
        updateData.headline = `${currentOrLatest.title} at ${currentOrLatest.company}`;
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );

      const { error: profileError } = await supabase
        .from('candidate_profiles')
        .update(updateData)
        .eq('id', candidateId);

      if (profileError) {
        console.error('Error updating candidate profile:', profileError);
        throw profileError;
      }

      console.log('✅ Resume processed successfully:', {
        candidateId,
        fieldsExtracted: Object.keys(updateData).join(', '),
        skillsCount: parsedData.skills?.length || 0,
        educationCount: parsedData.education?.length || 0,
        languagesCount: parsedData.languages?.length || 0
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          parsedData,
          message: 'Resume processed successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle invalid methods
    console.warn('⚠️ Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Method not allowed',
        allowedMethods: ['GET', 'POST', 'OPTIONS']
      }),
      { 
        status: 405,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Allow': 'GET, POST, OPTIONS'
        }
      }
    );

  } catch (error) {
    console.error('❌ parse-resume fatal error (detailed):', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Erro ao processar currículo. Por favor, tente novamente.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

console.log('✅ Edge Function parse-resume ready');
