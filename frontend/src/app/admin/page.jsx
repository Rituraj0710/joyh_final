"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndexPage(){
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);
  return null;
}

export const dynamic = "force-dynamic";

