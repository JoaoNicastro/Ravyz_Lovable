import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const CepSchema = z.object({
  cep: z.string().regex(/^\d{8}$/, 'CEP deve conter exatamente 8 dígitos'),
});

// Response validation schema
const ViaCepResponseSchema = z.object({
  logradouro: z.string().max(200),
  bairro: z.string().max(100),
  localidade: z.string().max(100),
  uf: z.string().length(2),
  erro: z.boolean().optional(),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = CepSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'CEP inválido',
          details: validationResult.error.errors
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { cep } = validationResult.data;
    console.log('Looking up CEP:', cep);
    
    // Call external ViaCEP API
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('ViaCEP API returned error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Serviço de CEP temporariamente indisponível' }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const data = await response.json();
    
    // Check for error response from ViaCEP
    if (data.erro === true) {
      return new Response(
        JSON.stringify({ error: 'CEP não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate response structure
    const responseValidation = ViaCepResponseSchema.safeParse(data);
    if (!responseValidation.success) {
      console.error('ViaCEP response validation failed:', responseValidation.error);
      return new Response(
        JSON.stringify({ error: 'Resposta inválida do serviço de CEP' }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const validated = responseValidation.data;
    
    // Sanitize and limit output
    const sanitizedResponse = {
      street: validated.logradouro.substring(0, 200).trim(),
      neighborhood: validated.bairro.substring(0, 100).trim(),
      city: validated.localidade.substring(0, 100).trim(),
      state: validated.uf.trim(),
    };
    
    console.log('CEP lookup successful');
    
    return new Response(
      JSON.stringify(sanitizedResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Error in lookup-cep function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar CEP. Por favor, tente novamente.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
