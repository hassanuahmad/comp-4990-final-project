import "@/app/globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
    title: "TextEmote",
    description: "Get your emotion details right away!",
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body>{children}</body>
            </html>
        </ClerkProvider>
    );
}
