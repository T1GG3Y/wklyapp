
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-4 pt-4">
        <div className="space-y-6 text-sm text-muted-foreground">
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <p>
                Welcome to WKLY. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
            </p>

            <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">Collection of Your Information</h2>
                <p>
                    We may collect information about you in a variety of ways. The information we may collect via the Application includes:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>
                        <strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, that you voluntarily give to us when you register with the Application.
                    </li>
                    <li>
                        <strong>Financial Data:</strong> Financial information, such as data related to your income, expenses, and transactions, that you voluntarily provide when using our app's features. All financial data is stored securely and is only accessible by you.
                    </li>
                    <li>
                        <strong>Mobile Device Data:</strong> We do not collect device information, such as your mobile device ID, model, and manufacturer.
                    </li>
                </ul>
            </div>

            <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">Use of Your Information</h2>
                <p>
                    Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:
                </p>
                 <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>Create and manage your account.</li>
                    <li>Provide you with the features and functionality of the app, such as budget tracking and financial summaries.</li>
                    <li>Email you regarding your account or order.</li>
                </ul>
            </div>

            <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">Disclosure of Your Information</h2>
                <p>
                    We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. All data you provide is for your use only and is not shared with third parties, except to comply with the law or protect our rights.
                </p>
            </div>

             <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">Security of Your Information</h2>
                <p>
                    We use administrative, technical, and physical security measures to help protect your personal information. We use Firebase, a platform by Google, which provides industry-leading security for your data. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
                </p>
            </div>
            
            <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">Account Deletion</h2>
                <p>
                    You may request to delete your account at any time by navigating to the "Profile" section of the application and selecting the "Delete Account" option. Upon your request, we will permanently delete your account and all associated data from our systems. This action is irreversible.
                </p>
            </div>

            <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">Contact Us</h2>
                <p>
                    If you have questions or comments about this Privacy Policy, please contact us.
                </p>
            </div>
        </div>
    </main>
  );
}
