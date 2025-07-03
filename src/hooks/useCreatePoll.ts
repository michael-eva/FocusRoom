

interface PollData {
    title: string;
    description: string;
    options: string[];
}

interface PollPost {
    id: number;
    type: "poll";
    author: {
        name: string;
        avatar: string;
        role: string;
    };
    title: string;
    content: string;
    pollOptions: { id: number; text: string; votes: number }[];
    createdAt: Date;
    likes: number;
    comments: number;
    totalVotes: number;
    userHasVoted: boolean;
}

export const useCreatePoll = () => {
    const createPoll = (pollData: PollData): PollPost => {
        const newPost: PollPost = {
            id: Math.floor(Math.random() * 100000), // This should be handled by a backend/DB
            type: "poll",
            author: {
                name: "You",
                avatar: "YU",
                role: "member",
            },
            title: pollData.title,
            content: pollData.description,
            pollOptions: pollData.options.map((option: string, index: number) => ({
                id: index + 1,
                text: option,
                votes: 0,
            })),
            createdAt: new Date(),
            likes: 0,
            comments: 0,
            totalVotes: 0,
            userHasVoted: false,
        };
        return newPost;
    };

    return { createPoll };
};