'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Removed useWhop – current @whop/react version does not export this hook
import { User, Lock, DollarSign, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  // Simple landing without relying on useWhop hook
  // Gatekeeping is handled on server-protected routes (e.g., dashboard, API)

  return (
    <div className="min-h-screen bg-gray-a12 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-8 font-bold text-gray-9 mb-4">
            Welcome to Private Room Manager
          </h1>
          <p className="text-4 text-gray-6">
            Create and manage paid private rooms for your Whop community
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-6 w-6" />
                Welcome!
              </CardTitle>
              <CardDescription>
                You're authenticated and ready to manage your rooms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-6">
                  Create paid rooms that users can access after payment. Each room gets a unique password for entry.
                </p>
                <Button asChild>
                  <Link href="/dashboard">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Set Your Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-6">
                  Create rooms with custom pricing - $20, $100, $1000, or any amount you choose.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Secure Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-6">
                  Users receive unique passwords after payment for secure room access.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-2 text-gray-5">
            <p>
              Need help? Visit the{" "}
              <a
                href="https://dev.whop.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-9 hover:text-accent-10 underline"
              >
                Whop Documentation
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
