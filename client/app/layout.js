import "@/app/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
    title: "TextEmote",
    description: "Get your emotion details right away!",
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body>
                    {children}
                    <Toaster />
                </body>
            </html>
        </ClerkProvider>
    );
}
