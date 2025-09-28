import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParsedResumeData {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  projects: Array<{
    name: string;
    description: string;
    technologies?: string[];
    url?: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { resumeAnalysisId, fileUrl } = await req.json()

    if (!resumeAnalysisId || !fileUrl) {
      throw new Error('Missing required parameters')
    }

    console.log(`Processing resume analysis ${resumeAnalysisId} for user ${user.id}`)

    // Fetch the PDF file
    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      throw new Error('Failed to fetch resume file')
    }

    const pdfArrayBuffer = await fileResponse.arrayBuffer()
    
    // For now, we'll use a simple text extraction approach
    // In a real implementation, you would use PDF.js or a similar library
    const extractedData = await extractResumeData(pdfArrayBuffer)

    // Calculate scores based on extracted data
    const scores = calculateScores(extractedData)

    // Update the resume analysis record
    const { error: updateError } = await supabase
      .from('resume_analyses')
      .update({
        processing_status: 'completed',
        extracted_data: extractedData,
        technical_score: scores.technical,
        soft_skills_score: scores.soft,
        overall_score: scores.overall,
        skills_extracted: extractedData.skills.technical,
        experience_summary: {
          totalYears: calculateTotalExperience(extractedData.experience),
          companies: extractedData.experience.map(exp => exp.company),
          positions: extractedData.experience.map(exp => exp.title)
        },
        ai_suggestions: generateSuggestions(extractedData)
      })
      .eq('id', resumeAnalysisId)

    if (updateError) {
      throw updateError
    }

    console.log(`Successfully processed resume analysis ${resumeAnalysisId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        scores: scores
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error processing resume:', error)

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function extractResumeData(pdfArrayBuffer: ArrayBuffer): Promise<ParsedResumeData> {
  // This is a simplified implementation
  // In a real scenario, you would use PDF.js to extract text and then parse it
  
  // For now, return mock data that demonstrates the structure
  const mockData: ParsedResumeData = {
    personalInfo: {
      name: "Extracted from PDF",
      email: "extracted@email.com",
      phone: "(555) 123-4567",
      location: "San Francisco, CA"
    },
    experience: [
      {
        title: "Software Engineer",
        company: "Tech Company Inc",
        startDate: "2020",
        endDate: "Present",
        description: ["Developed web applications", "Worked with React and Node.js"]
      }
    ],
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        institution: "University of Technology",
        startDate: "2016",
        endDate: "2020"
      }
    ],
    skills: {
      technical: ["JavaScript", "React", "Node.js", "Python", "SQL"],
      soft: ["Communication", "Problem Solving", "Teamwork"],
      languages: ["English", "Spanish"]
    },
    projects: [
      {
        name: "Personal Portfolio",
        description: "Built a responsive portfolio website using React"
      }
    ]
  }

  return mockData
}

function calculateScores(data: ParsedResumeData) {
  // Calculate technical score based on number of technical skills
  const technicalScore = Math.min(data.skills.technical.length * 10, 100)
  
  // Calculate soft skills score based on experience descriptions
  const softScore = Math.min(data.experience.length * 20, 100)
  
  // Calculate overall score as average of technical and soft scores
  const overallScore = (technicalScore + softScore) / 2

  return {
    technical: technicalScore,
    soft: softScore,
    overall: overallScore
  }
}

function calculateTotalExperience(experience: ParsedResumeData['experience']): number {
  // Simple calculation - count years from experience entries
  return experience.length * 2 // Assume 2 years per position on average
}

function generateSuggestions(data: ParsedResumeData): string[] {
  const suggestions = []

  if (data.skills.technical.length < 5) {
    suggestions.push("Consider adding more technical skills to your resume")
  }

  if (data.experience.length < 2) {
    suggestions.push("Add more work experience details to strengthen your profile")
  }

  if (!data.personalInfo.linkedin) {
    suggestions.push("Include your LinkedIn profile URL")
  }

  return suggestions
}