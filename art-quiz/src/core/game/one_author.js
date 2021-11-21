import Message from '../components/message';

export default class AuthorGame {
    static vars = {
        dbUrl: './data.json',
        dbUrlForFullImg: 'https://raw.githubusercontent.com/shadowinhaze/image-data/master/full',
        quastion: 'Who is the author of this picture?'
    }

    static gameVars = {
        activeRound: 0,
        gameColletion: [],
        allAuthors: [],
        allRoundsGames: []
    }
    
    static async getDataFromDB() {
        try {
            const response = await fetch(AuthorGame.vars.dbUrl);
            const data = await response.json();
            AuthorGame.getAuthors(data.collection);
            AuthorGame.genGameCollection(data.collection);
            return true;
        } catch (err) {
            console.warn('Something went wrong.', err);
        }    
    }

    static async genQuestionImage(imgNum) {
        const response = await fetch(`${AuthorGame.vars.dbUrlForFullImg}/${imgNum}full.jpg`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        // const quastionImg = document.createElement('img');
        // quastionImg.classList.add('question-img');
        // quastionImg.src = url;
        return url;
    }

    static genAnswers(arr) {
        let answerButtons = [];
        arr = AuthorGame.shuffle(arr);
        for (let i = 0; i < arr.length; i++) {
            const quastionButton = document.createElement('button');
            quastionButton.classList.add('default-button', 'answer-button');
            quastionButton.innerText = arr[i];
            quastionButton.dataset.author = arr[i];
            
            quastionButton.addEventListener('click', function() {
                const message = document.querySelector('.message')
                message.classList.toggle('visible');
                if (AuthorGame.checkAnswer(quastionButton.dataset.author)) {
                    quastionButton.classList.add('right');
                    AuthorGame.setPaginationDotStatus('right');
                    Message.setMessageText(Message.vars.rightMessage);
                    Message.genNextButton();
                } else {
                    quastionButton.classList.add('wrong');
                    AuthorGame.setPaginationDotStatus('wrong');
                    Message.setMessageText(Message.vars.wrongMessage);
                    Message.genNextButton();
                }
            })

            answerButtons.push(quastionButton)
        }
        return answerButtons;
    }

    static genPagination(num) {
        const paginationContainer = document.querySelector('.main-quastion__pagination');
        for (let i = 0; i < num; i++) {
            const pagDot = document.createElement('div');
            pagDot.classList.add('pagination-dot');
            pagDot.addEventListener('click', () => {
                if (pagDot.classList.contains('active') || pagDot.classList.contains('wrong')) {
                    return;
                }
                AuthorGame.gameVars.activeRound = i;
                AuthorGame.setPaginationDotStatus('active');
                AuthorGame.setQuestion();
            })
            paginationContainer.append(pagDot);
        }
    }

    static setPaginationDotStatus(status) {
        const pagintaionDots = document.querySelectorAll('.pagination-dot');
        pagintaionDots.forEach((item, index) => {
            if (index === AuthorGame.gameVars.activeRound) {
                switch (status) {
                    case 'active':
                        item.classList.add(status)
                        break;
                    case 'right':
                        item.classList.replace('active', 'right')
                        break;
                    case 'wrong':
                        item.classList.replace('active', 'wrong')
                        break;
                }
            } else {
                item.classList.remove('active')
            }
        })
    }

    static shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr
    }

    static getRandomItem(arr) {
        return arr[Math.floor(Math.random()*arr.length)];
    }

    static getAuthors(data) {
        // const dbPull = await AuthorGame.getDataFromDB();
        const dbAuthors = new Set();
        data.forEach(item => dbAuthors.add(item.author));
        AuthorGame.gameVars.allAuthors = [...dbAuthors];
        // return [...dbAuthors];
    }

    static getUnicGroup(firstItem, arr, num) {
        let result = new Set();
        result.add(firstItem);
        while (result.size !== num) {
            result.add(AuthorGame.getRandomItem(arr))
        }
        return [...result];
    }

    static genGameCollection(data) {
        AuthorGame.gameVars.gameColletion = data.splice(0, 10);
    }

    static async genQuestion(round) {
        const roundItem = AuthorGame.gameVars.gameColletion[round];
        
        const winner = roundItem.author
        const imageUrl = await AuthorGame.genQuestionImage(roundItem.imageNum);
        const roundAnswers = AuthorGame.getUnicGroup(roundItem.author, AuthorGame.gameVars.allAuthors, 4);
        const buttons = AuthorGame.genAnswers(roundAnswers);

        return { winner, imageUrl, buttons }
    }

    static async genAllRoundsGames() {
        for (let i = 0; i < AuthorGame.gameVars.gameColletion.length; i++) {
            const item = await AuthorGame.genQuestion(i)
            AuthorGame.gameVars.allRoundsGames.push(item)
        }
    }

    static checkAnswer(data) {
        return (data === AuthorGame.gameVars.allRoundsGames[AuthorGame.gameVars.activeRound].winner) ? true : false ;
    }

    static setQuestion() {
        const imageUrl = AuthorGame.gameVars.allRoundsGames[AuthorGame.gameVars.activeRound].imageUrl;
        const buttons = AuthorGame.gameVars.allRoundsGames[AuthorGame.gameVars.activeRound].buttons;
        const questionImg = document.querySelector('.question-img');
        const questionAnswers = document.querySelector('.answer-block');
        questionImg.src = imageUrl;
        questionAnswers.innerHTML = '';
        buttons.forEach(item => questionAnswers.prepend(item));
    }

    async render() {
        await AuthorGame.getDataFromDB();
        await AuthorGame.genAllRoundsGames();

        AuthorGame.setQuestion();
        AuthorGame.genPagination(10);
        AuthorGame.setPaginationDotStatus('active');
    }
}