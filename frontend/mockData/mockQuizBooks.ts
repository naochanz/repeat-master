export const mockQuizBooks = [
    {
        id: '1',
        title: 'FP3級',
        category: 'ファイナンシャルプランナー',
        chapterCount: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        currentRate: 85,
        useSections: true,
        chapters: [
            {
                id: '1',
                chapterNumber: 1,
                title: 'ライフプランニング',
                chapterRate: 70,
                questionCount: 0,
                sections: [{
                    id: '1-1',
                    sectionNumber: 1,
                    title: 'FPと倫理',
                    questionCount: 10,
                },
                {
                    id: '1-2',
                    sectionNumber: 2,
                    title: 'おっさんと倫理',
                    questionCount: 10,
                }],

            },
            {
                id: '2',
                chapterNumber: 2,
                title: 'おっさんとサシ飲み',
                chapterRate: 70,
                sections: [],
                questionCount: 20
            }
        ]
    },

]