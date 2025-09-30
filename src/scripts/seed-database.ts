/**
 * Script to seed the Supabase database with mock candidates and jobs data
 * 
 * Usage:
 * 1. Make sure you have a Supabase service role key configured
 * 2. Run: npx tsx src/scripts/seed-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import candidatesData from '../mock/candidates.json';
import jobsData from '../mock/jobs.json';

const SUPABASE_URL = "https://wmwpjbagtohitynxoqqx.supabase.co";
// You'll need to provide the service role key (not the anon key) to bypass RLS
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('💡 Get it from: https://supabase.com/dashboard/project/wmwpjbagtohitynxoqqx/settings/api');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedJobs() {
  console.log('\n📋 Seeding jobs...');
  console.log(`Total jobs to insert: ${jobsData.length}`);

  const jobsToInsert = jobsData.map(job => ({
    id: job.id,
    company_id: job.company_id,
    title: job.title,
    description: job.description,
    requirements: job.requirements, // Array will be converted to JSONB
    pillar_scores: job.pillar_scores,
    archetype: job.archetype,
    status: job.status,
    location: job.location,
    created_at: job.created_at
  }));

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < jobsToInsert.length; i += batchSize) {
    const batch = jobsToInsert.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('jobs')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} jobs)`);
    }
  }

  console.log(`\n✨ Jobs seeding complete: ${inserted} inserted, ${errors} errors`);
}

async function seedCandidates() {
  console.log('\n👥 Seeding candidates...');
  console.log(`Total candidates to insert: ${candidatesData.length}`);

  const candidatesToInsert = candidatesData.map(candidate => ({
    id: candidate.id,
    // Generate a consistent user_id from candidate id (for mock data)
    user_id: candidate.id, // Using same UUID as candidate_id for mock data
    full_name: candidate.full_name,
    email: candidate.email,
    phone: candidate.phone,
    location: candidate.location,
    years_experience: candidate.years_experience,
    skills: candidate.skills, // Array will be converted to JSONB
    pillar_scores: candidate.pillar_scores,
    archetype: candidate.archetype,
    headline: candidate.headline,
    created_at: candidate.created_at
  }));

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < candidatesToInsert.length; i += batchSize) {
    const batch = candidatesToInsert.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('candidate_profiles')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} candidates)`);
    }
  }

  console.log(`\n✨ Candidates seeding complete: ${inserted} inserted, ${errors} errors`);
}

async function verifyData() {
  console.log('\n🔍 Verifying seeded data...');

  const { count: jobsCount, error: jobsError } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });

  const { count: candidatesCount, error: candidatesError } = await supabase
    .from('candidate_profiles')
    .select('*', { count: 'exact', head: true });

  if (jobsError) {
    console.error('❌ Error counting jobs:', jobsError);
  } else {
    console.log(`✅ Total jobs in database: ${jobsCount}`);
  }

  if (candidatesError) {
    console.error('❌ Error counting candidates:', candidatesError);
  } else {
    console.log(`✅ Total candidates in database: ${candidatesCount}`);
  }

  // Show sample data
  const { data: sampleJobs } = await supabase
    .from('jobs')
    .select('id, title, status, location')
    .limit(3);

  const { data: sampleCandidates } = await supabase
    .from('candidate_profiles')
    .select('id, full_name, email, headline')
    .limit(3);

  console.log('\n📊 Sample jobs:');
  console.table(sampleJobs);

  console.log('\n📊 Sample candidates:');
  console.table(sampleCandidates);
}

async function main() {
  console.log('🚀 Starting database seeding...');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}`);

  try {
    await seedJobs();
    await seedCandidates();
    await verifyData();

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Go to /dashboard/candidate to see the jobs');
    console.log('2. Click "Candidatar-se" to apply to jobs');
    console.log('3. Applications should now work correctly!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
