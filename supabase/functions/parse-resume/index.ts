import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('🚀 Edge Function parse-resume initializing...');

serve(async (req) => {
  console.log('📥 Received request:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { resumeUrl, resumeAnalysisId, candidateId } = body;
    console.log('📄 Processing resume:', { 
      resumeUrl: resumeUrl?.substring(0, 50) + '...', 
      resumeAnalysisId, 
      candidateId,
      hasResumeUrl: !!resumeUrl,
      hasAnalysisId: !!resumeAnalysisId,
      hasCandidateId: !!candidateId
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const affindaApiKey = Deno.env.get('AFFINDA_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!affindaApiKey) {
      console.warn('AFFINDA_API_KEY not set, using fallback parsing');
      
      // Update status to completed with empty data
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

    // Call Affinda API
    console.log('Calling Affinda API...');
    const affindaResponse = await fetch('https://api.affinda.com/v3/resumes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${affindaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: resumeUrl,
        wait: true,
      }),
    });

    if (!affindaResponse.ok) {
      const errorText = await affindaResponse.text();
      console.error('Affinda API error:', errorText);
      throw new Error(`Affinda API error: ${affindaResponse.status}`);
    }

    const affindaData = await affindaResponse.json();
    console.log('Affinda response received');

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

    console.log('Resume processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        parsedData,
        message: 'Resume processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ FATAL ERROR processing resume:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

console.log('✅ Edge Function parse-resume ready');
