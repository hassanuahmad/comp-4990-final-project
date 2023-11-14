
"use client";
import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";


const Header = () => {
    const { user } = useUser();
    const userId = user?.id;
    
    return (
        <header className="bg-gray-50">
            <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex items-center justify-end gap-4">
                    <UserButton afterSignOutUrl="/" />
                </div>

                <div className="mt-8">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                        Welcome Back, {user ? user.fullName : "Guest"}!
                    </h1>

                    <p className="mt-1.5 text-sm text-gray-500">
                        Your website has seen a 52% increase in traffic in the
                        last month. Keep it up! 🚀
                    </p>
                </div>
            </div>
        </header>
    );
};

const formSchema = z.object({
    bio: z.string(),
});

export default function Dashboard() {
    const [apiRes, setApiRes] = useState([]);
    const { user } = useUser();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
        },
    });

    async function onSubmit(data) {
        try {
            const response = await fetch("http://localhost:3001/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    userInput: data.bio,
                    userId: user.id,
                 }),
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const responseData = await response.json();
            setApiRes(responseData.result.keywords);
        } catch (error) {
            console.error(
                "There was a problem with the fetch operation:",
                error.message
            );
        }
    }

    return (
        <>
            <Header />
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="w-2/3 space-y-6"
                >
                    <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Tell us a little bit about yourself"
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    You can <span>@mention</span> other users
                                    and organizations.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Submit</Button>
                </form>
            </Form>

            {apiRes.length > 0 && (
                <div className="mt-8">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                        Response
                    </h1>
                    {apiRes.map((item, index) => (
                        <div key={index}>
                            <p>{item.text}</p>
                            <p>{item.relevance}</p>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}