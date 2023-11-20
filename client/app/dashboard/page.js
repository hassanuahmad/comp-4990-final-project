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
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Bars3Icon } from "@heroicons/react/24/outline";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    FaceSmileIcon,
    FaceFrownIcon,
    StopCircleIcon,
} from "@heroicons/react/24/outline";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";

const formSchema = z.object({
    bio: z.string(),
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
                    "rgba(255, 99, 132, 0.6)", // Pink for sadness
                    "rgba(54, 162, 235, 0.6)", // Blue for joy
                    "rgba(255, 206, 86, 0.6)", // Yellow for fear
                    "rgba(75, 192, 192, 0.6)", // Green for disgust
                    "rgba(153, 102, 255, 0.6)", // Purple for anger
                ],
                borderColor: [
                    "rgba(255, 99, 132, 1)",
                    "rgba(54, 162, 235, 1)",
                    "rgba(255, 206, 86, 1)",
                    "rgba(75, 192, 192, 1)",
                    "rgba(153, 102, 255, 1)",
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
                return "text-pink-600";
            case "joy":
                return "text-blue-600";
            case "fear":
                return "text-yellow-600";
            case "disgust":
                return "text-green-600";
            case "anger":
                return "text-purple-600";
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
                <div className="flex h-16 justify-between">
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
                                                className="mb-2 py-2 border-b truncate hover:bg-gray-50 hover:rounded-sm"
                                                onClick={() =>
                                                    fetchUserInputDetails(
                                                        input.id
                                                    )
                                                }
                                            >
                                                {input.inputText}
                                            </div>
                                        ))}
                                    </SheetHeader>
                                </SheetContent>
                            </Sheet>
                        </div>
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
                                name="bio"
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
                            <Button className="w-full" type="submit">
                                Submit
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
