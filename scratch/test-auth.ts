import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Parse .env manually
const envPath = path.join(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
});

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"] || "";
const supabaseAnonKey = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] || "";

async function testAuth() {
  console.log("Supabase URL:", supabaseUrl);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const email = `test-${Date.now()}@example.com`;
  const password = "TestPassword123!";

  console.log(`Signing up user: ${email}`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: "Test Runner User",
      },
    },
  });

  if (signUpError) {
    console.error("Sign up error:", signUpError.message);
  } else {
    console.log("Sign up success:", signUpData.user?.id);
    console.log("Session status:", signUpData.session ? "Active" : "Needs email confirmation");
  }

  console.log(`Signing in user: ${email}`);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error("Sign in error:", signInError.message);
  } else {
    console.log("Sign in success. Session active:", signInData.session ? "Yes" : "No");
  }
}

testAuth();
