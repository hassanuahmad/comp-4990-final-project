"use client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { UserButton, useUser } from "@clerk/nextjs";
import {
    Bars3Icon,
    FaceFrownIcon,
    FaceSmileIcon,
    StopCircleIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import "chart.js/auto";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Logo from "@/public/logo.png";
import Image from "next/image";
import { set } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
    inputTextEmote: z
        .string()
        .min(15, { message: "Must be at least 20 characters" })
        .max(1000, { message: "Must be less than 1000 characters" }),
});

export default function Dashboard() {
    const { user } = useUser();
    if (!user) {
        return null;
    }
    const [sentimentLabel, setSentimentLabel] = useState("");
    const [emotionData, setEmotionData] = useState(null);
    const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
    const [userInputs, setUserInputs] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchAllUserInputs();
    }, [user.id]);

    const fetchAllUserInputs = async () => {
        try {
            const response = await fetch(
                `http://localhost:3001/user-inputs/${user.id}`
            );
            const data = await response.json();
            setUserInputs(data);
        } catch (error) {
            console.error("Error fetching user inputs:", error);
        }
    };

    const fetchUserInputDetails = async (inputID) => {
        try {
            const response = await fetch(
                `http://localhost:3001/user-input/${inputID}`
            );
            const data = await response.json();

            if (data.NLPResult) {
                const nlpResult = JSON.parse(data.NLPResult);

                const sentimentLabel =
                    nlpResult.result.sentiment.document.label;
                setSentimentLabel(sentimentLabel);

                const emotionData = nlpResult.result.emotion.document.emotion;
                setEmotionData(emotionData);

                setInputText(data.inputText);

                setIsHistorySheetOpen(false);
            }
        } catch (error) {
            console.error("Error fetching input details:", error);
        }
    };

    const handleDeleteInput = async (inputID) => {
        try {
            await fetch(`http://localhost:3001/user-input/${inputID}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            fetchAllUserInputs();
        } catch (error) {
            console.error("Error deleting user input:", error);
        }
    };

    const toggleHistorySheet = () => {
        setIsHistorySheetOpen(!isHistorySheetOpen);
    };

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
        },
    });

    async function onSubmit(data) {
        setIsLoading(true);
        try {
            const response = await fetch("http://localhost:3001/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userInput: data.inputTextEmote,
                    userId: user.id,
                }),
            });

            if (!response.ok) {
                toast({
                    variant: "destructive",
                    title: "Uh oh! Something went wrong.",
                    description:
                        "There was a problem with your request. Please enter the text again and make sure its proper English.",
                });
            }

            const responseData = await response.json();
            setSentimentLabel(
                responseData.analysisResults.result.sentiment.document.label
            );
            setEmotionData(
                responseData.analysisResults.result.emotion.document.emotion
            );
            fetchAllUserInputs();
        } catch (error) {
            console.error(
                "There was a problem with the fetch operation:",
                error.message
            );
        } finally {
            setIsLoading(false);
        }
    }

    const capitalizeFirstLetter = (string) =>
        string.charAt(0).toUpperCase() + string.slice(1);

    const pieData = {
        labels: Object.keys(emotionData || {}).map((emotion) =>
            capitalizeFirstLetter(emotion)
        ),
        datasets: [
            {
                label: "Emotions",
                data: Object.values(emotionData || {}),
                backgroundColor: [
                    "#4f72e3", // Steel Blue for Sadness
                    "#f7ef54", // Gold for Joy
                    "#b890de", // Medium Purple for Fear
                    "#83d479", // Olive Drab for Disgust
                    "#e8727c", // Indian Red for Anger
                ],
                borderColor: [
                    "#4f72e3", // Steel Blue for Sadness
                    "#f7ef54", // Gold for Joy
                    "#b890de", // Medium Purple for Fear
                    "#83d479", // Olive Drab for Disgust
                    "#e8727c", // Indian Red for Anger
                ],
                borderWidth: 1,
            },
        ],
    };

    const dominantEmotion = emotionData
        ? Object.keys(emotionData).reduce((a, b) =>
              emotionData[a] > emotionData[b] ? a : b
          )
        : null;

    const getEmotionColor = (emotion) => {
        switch (emotion) {
            case "sadness":
                return "text-blue-600";
            case "joy":
                return "text-yellow-300";
            case "fear":
                return "text-purple-500";
            case "disgust":
                return "text-green-500";
            case "anger":
                return "text-red-500";
            default:
                return "text-gray-600";
        }
    };

    const cardStyles = {
        positive: {
            bgColor: "bg-green-100",
            textColor: "text-green-700",
            badgeColor: "bg-green-200 text-green-800",
        },
        negative: {
            bgColor: "bg-red-100",
            textColor: "text-red-700",
            badgeColor: "bg-red-200 text-red-800",
        },
        neutral: {
            bgColor: "bg-yellow-100",
            textColor: "text-yellow-800",
            badgeColor: "bg-yellow-200 text-yellow-900",
        },
        default: {
            bgColor: "bg-gray-100",
            textColor: "text-gray-400",
            badgeColor: "bg-gray-200 text-gray-600",
        },
    };

    const getCardStyle = (type) => {
        return sentimentLabel === type ? cardStyles[type] : cardStyles.default;
    };

    return (
        <>
            {/* Navbar */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between items-center border-b">
                    <div className="flex">
                        <div className="flex flex-shrink-0 items-center">
                            <Sheet
                                open={isHistorySheetOpen}
                                onOpenChange={setIsHistorySheetOpen}
                            >
                                <SheetTrigger onClick={toggleHistorySheet}>
                                    <Bars3Icon className="h-6 w-6 text-green-950 hover:bg-gray-100 rounded-sm" />
                                </SheetTrigger>
                                <SheetContent side="left">
                                    <SheetHeader>
                                        <SheetTitle className="border-b py-4">
                                            TextEmote History
                                        </SheetTitle>
                                        {userInputs.map((input) => (
                                            <div
                                                key={input.id}
                                                className="flex justify-between mb-2 py-2 border-b hover:bg-gray-50 hover:rounded-sm"
                                            >
                                                <span
                                                    className="truncate w-72"
                                                    onClick={() =>
                                                        fetchUserInputDetails(
                                                            input.id
                                                        )
                                                    }
                                                >
                                                    {input.inputText}
                                                </span>
                                                <TrashIcon
                                                    className="h-6 w-6 text-red-500 hover:bg-gray-100 rounded-sm cursor-pointer"
                                                    onClick={() =>
                                                        handleDeleteInput(
                                                            input.id
                                                        )
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </SheetHeader>
                                </SheetContent>
                            </Sheet>
                            <Link href="/dashboard">
                                <Image
                                    className="ml-2"
                                    src={Logo}
                                    alt=""
                                    width={150}
                                    height="auto"
                                />
                            </Link>
                        </div>
                    </div>
                    <div>
                        <Link href="/dashboard">
                            <Button variant="link">Home</Button>
                        </Link>

                        <Link href="/stats">
                            <Button variant="link">Stats</Button>
                        </Link>
                    </div>
                    <div className="ml-6 flex items-center">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <header className="border-b py-8">
                    <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
                        Welcome Back, {user ? user.fullName : "Guest"}!
                    </h1>
                </header>
                <div className="max-w-2xl mx-auto py-12 border-b">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            <FormField
                                control={form.control}
                                name="inputTextEmote"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Message TextEmote to get your emotion details right away!"
                                                className="resize-none h-48"
                                                {...field}
                                                value={inputText || field.value}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    setInputText(
                                                        e.target.value
                                                    );
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                className="w-full"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? "Submitting..." : "Submit"}
                            </Button>
                        </form>
                    </Form>
                </div>
                <div className="py-12">
                    <h1 className="font-bold text-2xl text-center mb-6">
                        Sentiment Analysis
                    </h1>
                    <div className="max-w-2xl mx-auto space-x-8 flex justify-between text-center items-center">
                        <Card
                            className={`w-80 ${
                                getCardStyle("negative").bgColor
                            }`}
                        >
                            <CardHeader>
                                <CardTitle className="flex justify-center">
                                    <FaceFrownIcon className="h-12 w-12" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p
                                    className={`${
                                        getCardStyle("negative").textColor
                                    }`}
                                >
                                    The text you entered is negative!
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-center">
                                <span
                                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                        getCardStyle("negative").badgeColor
                                    }`}
                                >
                                    Negative
                                </span>
                            </CardFooter>
                        </Card>
                        <Card
                            className={`w-80 ${
                                getCardStyle("positive").bgColor
                            }`}
                        >
                            <CardHeader>
                                <CardTitle className="flex justify-center">
                                    <FaceSmileIcon className="h-12 w-12" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p
                                    className={`${
                                        getCardStyle("positive").textColor
                                    }`}
                                >
                                    The text you entered is positive!
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-center">
                                <span
                                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                        getCardStyle("positive").badgeColor
                                    }`}
                                >
                                    Positive
                                </span>
                            </CardFooter>
                        </Card>
                        <Card
                            className={`w-80 ${
                                getCardStyle("neutral").bgColor
                            }`}
                        >
                            <CardHeader>
                                <CardTitle className="flex justify-center">
                                    <StopCircleIcon className="h-12 w-12" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p
                                    className={`${
                                        getCardStyle("neutral").textColor
                                    }`}
                                >
                                    The text you entered is neutral
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-center">
                                <span
                                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                        getCardStyle("neutral").badgeColor
                                    }`}
                                >
                                    Neutral
                                </span>
                            </CardFooter>
                        </Card>
                    </div>

                    <div className="mt-8 max-w-2xl mx-auto">
                        <h2 className="font-bold text-2xl text-center mb-6">
                            Emotion Analysis
                        </h2>
                        <div className="max-w-md mx-auto">
                            <Pie data={pieData} />
                        </div>
                        {dominantEmotion && (
                            <p className="mt-4 text-lg text-center font-semibold">
                                Most Dominant Emotion:{" "}
                                <span
                                    className={`${getEmotionColor(
                                        dominantEmotion
                                    )}`}
                                >
                                    {capitalizeFirstLetter(dominantEmotion)}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
