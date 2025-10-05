-- Fix search_path for masking functions to address security linter warnings

CREATE OR REPLACE FUNCTION public.mask_cpf(cpf TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN cpf IS NULL THEN NULL
    WHEN LENGTH(cpf) >= 4 THEN '***.' || RIGHT(cpf, 3) || '-**'
    ELSE '***'
  END;
$$;

CREATE OR REPLACE FUNCTION public.mask_email(email TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN email IS NULL THEN NULL
    WHEN POSITION('@' IN email) > 1 THEN 
      LEFT(email, 2) || '***@' || SPLIT_PART(email, '@', 2)
    ELSE '***'
  END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(phone TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN phone IS NULL THEN NULL
    WHEN LENGTH(phone) >= 4 THEN '(**) ****-' || RIGHT(phone, 4)
    ELSE '****'
  END;
$$;

CREATE OR REPLACE FUNCTION public.mask_name(full_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN full_name IS NULL THEN NULL
    ELSE SPLIT_PART(full_name, ' ', 1) || ' ' || LEFT(SPLIT_PART(full_name, ' ', 2), 1) || '.'
  END;
$$;