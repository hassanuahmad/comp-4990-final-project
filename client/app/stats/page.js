"use client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { UserButton, useUser } from "@clerk/nextjs";
import {
    FaceFrownIcon,
    FaceSmileIcon,
    StopCircleIcon,
} from "@heroicons/react/24/outline";
import "chart.js/auto";
import Link from "next/link";
import { useEffect, useState } from "react";

import DatePickerWithRange from "@/components/dateRangePicker";
import { addDays } from "date-fns";
import { Pie } from "react-chartjs-2";
import Logo from "@/public/logo.png";
import Image from "next/image";

export default function Stats() {
    const { user } = useUser();

    if (!user) {
        return null;
    }

    const [selectedDateRange, setSelectedDateRange] = useState({
        from: new Date(),
        to: addDays(new Date(), 7),
    });

    const [sentimentLabels, setSentimentLabels] = useState([]);
    const [dominantSentiment, setDominantSentiment] = useState("");
    const [emotionData, setEmotionData] = useState({
        anger: 0,
        disgust: 0,
        fear: 0,
        joy: 0,
        sadness: 0,
    });
    const [dominantEmotion, setDominantEmotion] = useState("");
    const totalTextEmotes = sentimentLabels.length;

    const fetchInputsInRange = async () => {
        if (selectedDateRange.from && selectedDateRange.to) {
            try {
                const response = await fetch(
                    `http://localhost:3001/user-inputs-range/${
                        user.id
                    }?startDate=${selectedDateRange.from.toISOString()}&endDate=${selectedDateRange.to.toISOString()}`
                );
                const data = await response.json();

                let emotionSums = {
                    anger: 0,
                    disgust: 0,
                    fear: 0,
                    joy: 0,
                    sadness: 0,
                };
                let count = 0;

                const newSentimentLabels = data
                    .map((item) => {
                        if (item.NLPResult) {
                            const nlpResult = JSON.parse(item.NLPResult);
                            const emotions =
                                nlpResult.result.emotion.document.emotion;

                            Object.keys(emotions).forEach((emotion) => {
                                emotionSums[emotion] += emotions[emotion];
                            });
                            count++;

                            return nlpResult.result.sentiment.document.label;
                        }
                        return null;
                    })
                    .filter((label) => label !== null);

                if (count > 0) {
                    Object.keys(emotionSums).forEach((emotion) => {
                        emotionSums[emotion] /= count;
                    });
                }

                setEmotionData(emotionSums);
                setSentimentLabels(newSentimentLabels);
            } catch (error) {
                console.error("Error fetching inputs in range:", error);
            }
        }
    };

    useEffect(() => {
        fetchInputsInRange();
    }, [selectedDateRange]);

    const countSentiments = (labels) => {
        return labels.reduce(
            (acc, label) => {
                acc[label] = (acc[label] || 0) + 1;
                return acc;
            },
            { positive: 0, negative: 0, neutral: 0 }
        );
    };

    const sentimentCounts = countSentiments(sentimentLabels);

    const determineDominantEmotion = () => {
        let maxEmotion = "";
        let maxValue = 0;

        Object.keys(emotionData).forEach((emotion) => {
            if (emotionData[emotion] > maxValue) {
                maxValue = emotionData[emotion];
                maxEmotion = emotion;
            }
        });

        return maxEmotion;
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
        if (totalTextEmotes === 0) {
            return cardStyles.default;
        }
        return type === dominantSentiment
            ? cardStyles[type]
            : cardStyles.default;
    };

    const determineDominantSentiment = () => {
        const sentimentCounts = countSentiments(sentimentLabels);
        return Object.keys(sentimentCounts).reduce((a, b) =>
            sentimentCounts[a] > sentimentCounts[b] ? a : b
        );
    };

    useEffect(() => {
        const dominant = determineDominantEmotion();
        setDominantEmotion(dominant);
    }, [emotionData]);

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

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

    useEffect(() => {
        const dominantSentiment = determineDominantSentiment();
        setDominantSentiment(dominantSentiment);
    }, [sentimentLabels]);

    const stats = [
        {
            name: "Total TextEmotes",
            value: totalTextEmotes,
            badge: {
                text: "",
                bgColor: "",
            },
        },
        {
            name: "Positive TextEmotes",
            value: sentimentCounts.positive,
            badge: {
                text: "Positive",
                bgColor: "bg-green-100 text-green-700",
            },
        },
        {
            name: "Negative TextEmotes",
            value: sentimentCounts.negative,
            badge: {
                text: "Negative",
                bgColor: "bg-red-100 text-red-700",
            },
        },
        {
            name: "Neutral TextEmotes",
            value: sentimentCounts.neutral,
            badge: {
                text: "Neutral",
                bgColor: "bg-yellow-100 text-yellow-800",
            },
        },
    ];

    const EmotionPieChart = () => {
        const data = {
            labels: ["Anger", "Disgust", "Fear", "Joy", "Sadness"],
            datasets: [
                {
                    label: "Emotion Averages",
                    data: [
                        emotionData.anger,
                        emotionData.disgust,
                        emotionData.fear,
                        emotionData.joy,
                        emotionData.sadness,
                    ],
                    backgroundColor: [
                        "#e8727c", // Indian Red for Anger
                        "#83d479", // Olive Drab for Disgust
                        "#b890de", // Medium Purple for Fear
                        "#f7ef54", // Gold for Joy
                        "#4f72e3", // Steel Blue for Sadness
                    ],
                    borderColor: [
                        "#e8727c", // Indian Red for Anger
                        "#83d479", // Olive Drab for Disgust
                        "#b890de", // Medium Purple for Fear
                        "#f7ef54", // Gold for Joy
                        "#4f72e3", // Steel Blue for Sadness
                    ],
                    borderWidth: 1,
                },
            ],
        };

        return <Pie data={data} />;
    };

    return (
        <>
            {/* Navbar */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between items-center border-b">
                    <div className="flex">
                        <div className="flex flex-shrink-0 items-center">
                            <Link href="/dashboard">
                                <Image
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

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <header className="border-b py-8 flex justify-between items-center">
                    <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
                        Your TextEmote Stats
                    </h1>

                    <DatePickerWithRange onDateChange={setSelectedDateRange} />
                </header>

                <dl className="mx-auto grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.name}
                            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-10 sm:px-6 xl:px-8"
                        >
                            <dt className="text-sm font-medium leading-6 text-gray-500">
                                {stat.name}
                            </dt>
                            <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
                                {stat.value}
                            </dd>
                            <span
                                className={`inline-flex items-center rounded-full ${stat.badge.bgColor} px-1.5 py-0.5 text-xs font-medium`}
                            >
                                {stat.badge.text}
                            </span>
                        </div>
                    ))}
                </dl>
            </div>

            <div className="py-12">
                <h1 className="font-bold text-2xl text-center mb-6">
                    Entire TextEmotes Sentiment Analysis
                </h1>
                <div className="max-w-2xl mx-auto space-x-8 flex justify-between text-center items-center">
                    <Card
                        className={`w-80 h-64 ${
                            getCardStyle("negative").bgColor
                        } flex flex-col justify-between`}
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
                                Your total TextEmotes sentiment is negative!
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
                        className={`w-80 h-64 ${
                            getCardStyle("positive").bgColor
                        } flex flex-col justify-between`}
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
                                Your total TextEmotes sentiment is positive!
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
                        className={`w-80 h-64 ${
                            getCardStyle("neutral").bgColor
                        } flex flex-col justify-between`}
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
                                Your total TextEmotes sentiment is neutral!
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
                        Entire TextEmotes Emotion Analysis
                    </h2>
                    <div className="max-w-md mx-auto">
                        <EmotionPieChart />
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
        </>
    );
}
