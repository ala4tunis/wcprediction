"use server";

import { createClient } from "./supabase/server";
import { prisma } from "./db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Check if the user exists in our Prisma User model. If not, create them.
 */
export async function syncUserToDb(supabaseUser: { 
  id: string; 
  email?: string; 
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}) {
  if (!supabaseUser) return null;

  const existing = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  });

  if (!existing) {
    const name = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "User";
    const avatarUrl = supabaseUser.user_metadata?.avatar_url || null;

    return await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        name: name,
        avatarUrl: avatarUrl,
      },
    });
  }

  return existing;
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.user) {
    await syncUserToDb(data.user);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.user) {
    await syncUserToDb({
      id: data.user.id,
      email: data.user.email,
      user_metadata: { full_name: name },
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data?.url) {
    redirect(data.url);
  }
}

export async function signInWithGitHub() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data?.url) {
    redirect(data.url);
  }
}

export async function signInWithFacebook() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data?.url) {
    redirect(data.url);
  }
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
