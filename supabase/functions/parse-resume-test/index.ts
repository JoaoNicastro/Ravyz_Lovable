import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Mock data de um currículo exemplo
    const mockAffindaResponse = {
      data: {
        name: { raw: "João da Silva" },
        emails: ["joao.silva@example.com"],
        phoneNumbers: ["+55 11 98765-4321"],
        location: { formatted: "São Paulo, SP, Brasil" },
        dateOfBirth: "1990-05-15",
        summary: "Profissional experiente em desenvolvimento full-stack com foco em React e Node.js",
        workExperience: [
          {
            organization: "Tech Company",
            jobTitle: "Senior Software Engineer",
            dates: {
              startDate: "2020-01-01",
              endDate: null,
              isCurrent: true
            },
            jobDescription: "Desenvolvimento de aplicações web usando React e Node.js"
          },
          {
            organization: "Startup XYZ",
            jobTitle: "Full Stack Developer",
            dates: {
              startDate: "2018-03-01",
              endDate: "2019-12-31",
              isCurrent: false
            }
          }
        ],
        education: [
          {
            organization: "Universidade de São Paulo",
            accreditation: {
              education: "Bacharel em Ciência da Computação",
              educationLevel: "Bacharelado"
            },
            dates: {
              startDate: "2010-02-01",
              completionDate: "2014-12-15",
              isCurrent: false
            }
          }
        ],
        skills: [
          { name: "JavaScript" },
          { name: "React" },
          { name: "Node.js" },
          { name: "TypeScript" },
          { name: "PostgreSQL" },
          { name: "Docker" }
        ],
        languages: [
          { name: "Português", proficiency: "Nativo" },
          { name: "Inglês", proficiency: "Fluente" }
        ],
        certifications: [
          {
            name: "AWS Certified Developer",
            organization: "Amazon Web Services",
            date: "2021-06-01"
          }
        ],
        websites: [
          "https://linkedin.com/in/joaosilva",
          "https://github.com/joaosilva"
        ],
        totalYearsExperience: 7
      }
    };

    // Mapear exatamente como a Edge Function real faz
    const parsedData = {
      full_name: mockAffindaResponse.data?.name?.raw || null,
      email: mockAffindaResponse.data?.emails?.[0] || null,
      phone: mockAffindaResponse.data?.phoneNumbers?.[0] || null,
      location: mockAffindaResponse.data?.location?.formatted || null,
      date_of_birth: mockAffindaResponse.data?.dateOfBirth || null,
      professional_summary: mockAffindaResponse.data?.summary || null,
      work_experience: mockAffindaResponse.data?.workExperience?.map((exp: any) => ({
        company: exp.organization || '',
        title: exp.jobTitle || '',
        start_date: exp.dates?.startDate || null,
        end_date: exp.dates?.endDate || null,
        current: exp.dates?.isCurrent || false,
        description: exp.jobDescription || null,
      })) || [],
      education: mockAffindaResponse.data?.education?.map((edu: any) => ({
        institution: edu.organization || '',
        degree: edu.accreditation?.education || '',
        field: edu.accreditation?.educationLevel || null,
        start_date: edu.dates?.startDate || null,
        end_date: edu.dates?.completionDate || null,
        status: edu.dates?.isCurrent ? 'in_progress' : 'completed',
      })) || [],
      skills: mockAffindaResponse.data?.skills?.map((skill: any) => skill.name).filter(Boolean) || [],
      languages: mockAffindaResponse.data?.languages?.map((lang: any) => ({
        name: lang.name || '',
        proficiency: lang.proficiency || null,
      })) || [],
      certifications: mockAffindaResponse.data?.certifications?.map((cert: any) => ({
        name: cert.name || '',
        issuer: cert.organization || null,
        issue_date: cert.date || null,
      })) || [],
      linkedin_url: mockAffindaResponse.data?.websites?.find((w: any) => w.includes('linkedin')) || null,
      github_url: mockAffindaResponse.data?.websites?.find((w: any) => w.includes('github')) || null,
      years_of_experience: mockAffindaResponse.data?.totalYearsExperience || null,
    };

    // Dados para update no candidate_profiles
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

    if (parsedData.work_experience && parsedData.work_experience.length > 0) {
      const currentOrLatest = parsedData.work_experience.find((exp: any) => exp.current) || parsedData.work_experience[0];
      updateData.current_position = currentOrLatest.title;
      updateData.headline = `${currentOrLatest.title} at ${currentOrLatest.company}`;
    }

    // Remove undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Mock test successful - no API calls made',
        parsedData,
        candidateProfileUpdate: updateData,
        fieldsToAutoFill: Object.keys(updateData),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
