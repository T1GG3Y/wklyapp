
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function DeleteAccountPage() {
  return (
    <Card>
        <CardHeader>
            <CardTitle className="text-2xl font-bold">Account Deletion</CardTitle>
            <CardDescription>
                How to permanently delete your WKLY account and data.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4 text-muted-foreground">
                <p>
                    We believe in giving you full control over your data. You can request to delete your account and all associated information at any time directly from within the application.
                </p>
                <h3 className="font-bold text-foreground pt-2">Instructions:</h3>
                <ol className="list-decimal list-inside space-y-2">
                    <li>Log in to your <strong>WKLY</strong> account in the mobile app.</li>
                    <li>Navigate to the <strong>Profile</strong> tab using the bottom navigation bar.</li>
                    <li>Tap on the <strong>&quot;Delete Account&quot;</strong> button.</li>
                    <li>A confirmation dialog will appear. To proceed, confirm the deletion.</li>
                </ol>
                <p className="font-semibold text-destructive pt-4">
                    Please be aware that this action is irreversible. Once you confirm, your account and all of your financial data will be permanently deleted from our systems.
                </p>
            </div>
             <Button asChild className="w-full sm:w-auto">
                <Link href="/login">Log In to Your Account</Link>
            </Button>
        </CardContent>
    </Card>
  );
}
