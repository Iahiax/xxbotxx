const Wolf = require('wolf.js');
const client = new Wolf.Client();

// قائمة الفواكه المطلوبة
const FRUITS = [
    "تفاح", "توت العليق الأوروبي", "عنب", "ليمون", "بابايا", "موز", "كيوي", "طماطم", "خيار",
    "باذنجان", "مشمش", "دراق", "خوخ", "مانجو", "كرز", "فول", "حمص", "بازيلاء", "فاصولياء",
    "جوز", "لوز", "بندق", "فراولة", "توت بري", "توت عليق", "قشطة", "أناناس", "تين", "توت شامي",
    "فاكهة الخبز", "جوز الهند", "برتقال", "جريب فروت", "رمان", "زيتون", "سفرجل", "عنب أوروبي",
    "كاكا", "أجاص", "أكي دنيا", "برقوق", "إجاص", "بكان", "فستق", "كاشو", "توت", "بلح", "تمر",
    "نارنج", "كمثرى", "نكترين", "أفوكادو", "يوسفي", "بطيخ", "شمام", "ليمون حمضي", "آس بري",
    "افوكادو", "أكي", "تمر هندي", "فاكهة التنين", "تين شوكي", "جوافة", "زعرور", "صبار",
    "حبوب الصنوبر", "عليق", "عناب", "عنبية", "قرع", "كاجو", "كاكاو", "كاكي", "كريفون",
    "كشمش أسود", "كمكوات", "كوسة", "لوز استوائي", "لونجان", "ليتشي", "نبق", "حمضيات",
    "جوز كالانرى", "ديكوبون", "باشون فروت", "كمثرى وليامز", "توماتيلو", "بيرى", "دوريان",
    "سفرجل هندى", "كريز المارشينو", "زبيب", "ليم", "عنب الثعلب", "جوجى", "لانزونز", "يد بوذا",
    "لوكوما", "نجمة التفاح", "بالميرا", "مانجوستين", "جاك فروت", "بلو بيري", "كارامبولا",
    "فاكهة النجمة", "توت العليق", "بلوط", "بوملي", "رامبوتان", "بطيخ أحمر", "مندلينا"
];

// تخزين الحالات
let games = {};
let playerScores = { global: {}, group: {} };

client.on('ready', async () => {
    console.log(`Logged in as ${client.currentSubscriber.nickname}`);
});

client.on('message', async (message) => {
    if (!message.isCommand) return;

    const command = message.command.toLowerCase();
    const args = message.argument.split(' ');
    const groupId = message.targetGroupId;
    const userId = message.sourceSubscriberId;

    // أمر إنشاء لعبة جديدة
    if (['!جس', '!جاسوس'].includes(command) && ['انشاء', 'إنشاء'].includes(args[0])) {
        createGame(message, groupId, userId);
    }

    // أمر الانضمام للعبة
    else if (['!جس', '!جاسوس'].includes(command) && ['انظم', 'إنظم'].includes(args[0])) {
        joinGame(message, groupId, userId);
    }

    // أمر بدء اللعبة
    else if (['!جس', '!جاسوس'].includes(command) && ['ابدأ', 'بدء', 'أبدا'].includes(args[0])) {
        startGame(message, groupId, userId);
    }

    // أمر التصويت
    else if (['!جس', '!جاسوس'].includes(command) && !isNaN(args[0])) {
        voteForSpy(message, groupId, userId, parseInt(args[0]));
    }

    // أمر عرض المجموع
    else if (['!جس', '!جاسوس'].includes(command) && ['مجموع', 'المجموع'].includes(args[0])) {
        showGroupScores(message, groupId);
    }

    // أمر الترتيب العالمي
    else if (['!جس', '!جاسوس'].includes(command) && ['ترتيب', 'الترتيب'].includes(args[0])) {
        showGlobalRank(message, userId);
    }

    // أمر المساعدة
    else if (['!جس', '!جاسوس'].includes(command) && ['مساعدة', 'مساعده'].includes(args[0])) {
        showHelp(message);
    }
});

async function createGame(message, groupId, userId) {
    if (games[groupId]) {
        return message.reply('يوجد لعبة نشطة بالفعل!');
    }

    games[groupId] = {
        creator: userId,
        players: [],
        status: 'waiting',
        timer: setTimeout(() => endGame(groupId), 120000),
        reminder: setTimeout(() => {
            client.messaging.sendGroupMessage(groupId, '/alert باقي دقيقة على إغلاق اللعبة');
        }, 60000)
    };

    await message.reply('/me تم انشاء اللعبة اكتب (!جس انظم) او (!جاسوس انظم) للانضمام للعبة 🕵️‍♂️🥷');
}

async function joinGame(message, groupId, userId) {
    const game = games[groupId];
    if (!game || game.status !== 'waiting') {
        return message.reply('لا توجد لعبة قيد الانتظار!');
    }

    if (game.players.includes(userId)) {
        return message.reply('لقد انضممت بالفعل!');
    }

    game.players.push(userId);
    await message.reply(`تم انضمامك للعبة! عدد اللاعبين الآن: ${game.players.length}`);
}

async function startGame(message, groupId, userId) {
    const game = games[groupId];
    if (!game || game.creator !== userId) {
        return message.reply('فقط منشئ اللعبة يمكنه البدء!');
    }

    if (game.players.length < 2) {
        return message.reply('يحتاج على الأقل لاعبان!');
    }

    clearTimeout(game.timer);
    clearTimeout(game.reminder);
    game.status = 'in_progress';

    // اختيار الجاسوس عشوائياً
    const spyIndex = Math.floor(Math.random() * game.players.length);
    game.spyIndex = spyIndex;

    // اختيار فاكهة عشوائية (مختلفة عن السابقة)
    let fruitIndex;
    do {
        fruitIndex = Math.floor(Math.random() * FRUITS.length);
    } while (fruitIndex === game.lastFruitIndex);
    
    game.lastFruitIndex = fruitIndex;
    const fruit = FRUITS[fruitIndex];

    // إرسال الرسائل الخاصة
    for (let i = 0; i < game.players.length; i++) {
        const playerId = game.players[i];
        if (i === spyIndex) {
            await client.messaging.sendPrivateMessage(playerId, 'أنت الجاسوس في هذه الجولة! 🕵️‍♂️');
        } else {
            await client.messaging.sendPrivateMessage(playerId, `الفاكهة هي: ${fruit}`);
        }
    }

    // إرسال قائمة اللاعبين
    let playerList = '/me قائمة اللاعبين:\n';
    game.players.forEach((playerId, index) => {
        const player = client.cache.subscribers.get(playerId);
        playerList += `${index + 1} - ${playerId} - ${player.nickname}\n`;
    });
    playerList += '\nاستخدم الأمر (!جس رقم) أو (!جاسوس رقم) للتصويت';

    await message.reply(playerList);
}

async function voteForSpy(message, groupId, userId, playerNumber) {
    const game = games[groupId];
    if (!game || game.status !== 'in_progress') {
        return message.reply('لا توجد لعبة نشطة!');
    }

    const playerIndex = playerNumber - 1;
    if (playerIndex < 0 || playerIndex >= game.players.length) {
        return message.reply('رقم لاعب غير صحيح!');
    }

    if (game.votes && game.votes[userId]) {
        return message.reply('لقد صوّتت بالفعل!');
    }

    // تسجيل التصويت
    if (!game.votes) game.votes = {};
    game.votes[userId] = playerIndex;

    // إرسال تأكيد التصويت
    const voter = client.cache.subscribers.get(userId);
    const votedPlayer = client.cache.subscribers.get(game.players[playerIndex]);
    await message.reply(`/alert ${voter.nickname} 🕵️‍♂️ صوت لـ ${votedPlayer.nickname} 🥷`);

    // التحقق إذا اكتمل التصويت
    if (Object.keys(game.votes).length === game.players.length) {
        endVotingPhase(groupId);
    }
}

async function endVotingPhase(groupId) {
    const game = games[groupId];
    game.status = 'ended';

    // حساب النقاط
    const spyPlayerId = game.players[game.spyIndex];
    game.results = {};

    // تحديث النقاط
    for (const [voterId, votedIndex] of Object.entries(game.votes)) {
        const votedPlayerId = game.players[votedIndex];
        const isSpy = votedPlayerId === spyPlayerId;
        
        // تحديث سجل النقاط
        updateScore(voterId, isSpy ? 1 : -1);
        updateScore(spyPlayerId, isSpy ? -1 : 1, groupId);
        
        // حفظ النتائج
        game.results[voterId] = {
            votedPlayerId,
            isCorrect: isSpy
        };
    }

    // إرسال النتائج
    let resultMessage = '/me نتائج الجولة:\n';
    for (let i = 0; i < game.players.length; i++) {
        const playerId = game.players[i];
        const player = client.cache.subscribers.get(playerId);
        const isSpy = playerId === spyPlayerId;
        
        let playerLine = `${i + 1} - ${playerId} - ${player.nickname} `;
        playerLine += isSpy ? '🥷 ' : '🕵️‍♂️ ';

        if (!isSpy) {
            const voteResult = game.results[playerId];
            playerLine += voteResult.isCorrect ? '✅ +1 ' : '❌ -1 ';
        }

        playerLine += `(${getPlayerScore(playerId, groupId)})`;
        resultMessage += playerLine + '\n';
    }

    await client.messaging.sendGroupMessage(groupId, resultMessage);
    delete games[groupId];
}

function updateScore(playerId, points, groupId = null) {
    // تحديث النقاط العالمية
    if (!playerScores.global[playerId]) playerScores.global[playerId] = 0;
    playerScores.global[playerId] += points;

    // تحديث نقاط المجموعة
    if (groupId) {
        if (!playerScores.group[groupId]) playerScores.group[groupId] = {};
        if (!playerScores.group[groupId][playerId]) playerScores.group[groupId][playerId] = 0;
        playerScores.group[groupId][playerId] += points;
    }
}

function getPlayerScore(playerId, groupId) {
    const globalScore = playerScores.global[playerId] || 0;
    const groupScore = playerScores.group[groupId]?.[playerId] || 0;
    return groupScore; // يمكن تعديل هذا حسب احتياجاتك
}

async function showGroupScores(message, groupId) {
    if (!playerScores.group[groupId]) {
        return message.reply('لا توجد نقاط مسجلة لهذه المجموعة!');
    }

    const scores = playerScores.group[groupId];
    const sortedScores = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    let scoreMessage = '/me أفضل 10 نقاط في المجموعة:\n';
    for (const [playerId, score] of sortedScores) {
        const player = client.cache.subscribers.get(parseInt(playerId));
        scoreMessage += `- ${player.nickname}: ${score}\n`;
    }

    await message.reply(scoreMessage);
}

async function showGlobalRank(message, userId) {
    const sortedScores = Object.entries(playerScores.global)
        .sort((a, b) => b[1] - a[1]);
    
    const userIndex = sortedScores.findIndex(([id]) => id == userId);
    const userRank = userIndex + 1;
    const userScore = playerScores.global[userId] || 0;

    await message.reply(`ترتيبك العالمي: #${userRank} - نقاطك: ${userScore}`);
}

async function showHelp(message) {
    const helpText = `
/me أوامر الجاسوس:
!جس انشاء - إنشاء لعبة جديدة
!جس انظم - الانضمام للعبة
!جس بدء - بدء اللعبة (للمنشئ فقط)
!جس [رقم] - التصويت على لاعب
!جس مجموع - عرض نقاط المجموعة
!جس ترتيب - ترتيبك العالمي
!جس مساعدة - عرض هذه القائمة
    `;
    await message.reply(helpText);
}

function endGame(groupId) {
    if (games[groupId]) {
        client.messaging.sendGroupMessage(groupId, 'تم إغلاق اللعبة بسبب انتهاء الوقت');
        delete games[groupId];
    }
}

client.login('BOT_EMAIL', 'BOT_PASSWORD');
