const axios = require("axios");
const request = require("request");
const fs = require("fs-extra");
const moment = require("moment-timezone");

module.exports.config = {
  name: "murgi",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "🔰𝗥𝗮𝗵𝗮𝘁_𝗕𝗼𝘀𝘀🔰",
  description: "Show murgi",
  commandCategory: "info",
  usages: "murgi [@mention/reply/UID/link/name]",
  cooldowns: 2
};

// ===== Helper: Full Name Mention Detection =====
async function getUIDByFullName(api, threadID, body) {
  if (!body.includes("@")) return null;
  const match = body.match(/@(.+)/);
  if (!match) return null;
  const targetName = match[1].trim().toLowerCase().replace(/\s+/g, " ");
  const threadInfo = await api.getThreadInfo(threadID);
  const users = threadInfo.userInfo || [];
  const user = users.find(u => {
	if (!u.name) return false;
	const fullName = u.name.trim().toLowerCase().replace(/\s+/g, " ");
	return fullName === targetName;
  });
  return user ? user.id : null;
}

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  let targetID;
  let targetName;

  // ===== Determine targetID in three ways =====
  if (event.type === "message_reply") {
	// Way 1: Reply to a message
	targetID = event.messageReply.senderID;
  } else if (args[0]) {
	if (args[0].indexOf(".com/") !== -1) {
  	// Way 2: Facebook profile link
  	targetID = await api.getUID(args[0]);
	} else if (args.join().includes("@")) {
  	// Way 3: Mention or full name
  	// 3a: Direct Facebook mention
  	targetID = Object.keys(event.mentions || {})[0];
  	if (!targetID) {
    	// 3b: Full name detection
    	targetID = await getUIDByFullName(api, event.threadID, args.join(" "));
  	}
	} else {
  	// Direct UID
  	targetID = args[0];
	}
  } else {
	// শুধু "-murgi" লিখলে নিজের আইডি ট্রিগার হবে না
	// বরং মেনশন করার জন্য বলবে
	return api.sendMessage("❌বস কোন মাগির ভুদায় কামুড় দিতে চাও তাকে ম্যানশন করো🤤", threadID);
  }

  if (!targetID) {
	return api.sendMessage("❌রাহাদ বসকে ডাক দে👀 \n ফাইল গেছে", threadID);
  }

  // Get user info for the name
  const userInfo = await api.getUserInfo(targetID);
  targetName = userInfo[targetID]?.name || "Unknown";

  if (!global.clientIntervals) global.clientIntervals = {};

  if (global.clientIntervals[threadID]) {
	return api.sendMessage("𝗕𝗼𝘀𝘀 না থামতে বললে থামবো না🫵🏻😎 ", threadID);
  }

  const messages = [
 `${targetName} আরে নাউযুবিল্লা করলাম শুরু তর মার ভুদায় কামুড় দিয়ে🫵🏽😈`,
 `✅চুদা থামাতে prefix দিয়ে stop টাইপ করো`,
 `✅চুদা থামাতে prefix দিয়ে stop টাইপ করো`,
 `✳️🪩না থামালে থামবো না🪩✳️`,
 `বজ্জাত খানকি মাগী BTS সাপোর্টার🥱`,
  `${targetName} তর মতো ফাজিল পলা পাইন এই প্রথম দেখলাম-!!😈।`,
  `${targetName} টোকাই পলা পাইন-!!😹..`,
  `${targetName} BTS ফ্যানদের জায়গায় নাই তদের মতো BTS ফ্যান কে পেলে হাতে পায়ের রগ কেতে দিতাম-!!🩸🪓`,
  `${targetName} দুরব চাওয়া মর তোর মতো ফাজিল আমাদের গ্রুপ এ থাকার যোগ্য-!!😹😈`,
  `${targetName} কামলা পলা পাইন কামলা দিবি দে এতো নাটক কসর কেনো-!!😹`,
  `${targetName} তুই তরা মা বাবার জারজ সন্তান-!!😈`,
  `${targetName} বাপ চিনে লাগতে আসিস না হলে পরে আপসস করতে হবে-!!😈😹`,
  `${targetName} ফাইলাম করি ভালো কথা তুই তর বাপের সাথে লাগতে আসবি কেনো রে BTS ফ্যান-!!🤬😈`,
  `${targetName} তুই এতো টা খারাপ যে তোকে দেখে জাহান্নাম ও ভয়ে কান্না করছে-!!🙂`,
  `${targetName} সময় থাকতে মানুষ হয়ে যা না হলে তরে আমাদের মানুষ করতে হবে-!!😈।`,
  `${targetName} ভিক্ষা করে তর জীবন চলে আর তুই আসছোট বাবাদের সাথে লাগতে-!!😈।`,
  `${targetName} দিন রাত হাত মাইরা বলস তুই পাপি নাহ তুই ভালো মানুষ-!!😹`,
  `${targetName} টোকাই পলা পাইন আমাদের ডাস্টবিনের ময়লা আবর্জনা টুকিয়ে তর জীবন চলে আর তুই আমাদের উপরে আসস কথা বলতে-!!😹`,
  "থাপ্পর খাবি তো বাপ চিনবি-!!😹",
  `${targetName} ভিক্ষা মাইংগা খাস আবার বড়ো বড়ো কথা বলস সরম করে নাহ BTS ফ্যান-!!😹।`,
  `${targetName} আমার ইসলাম এর সাথে লাগতে আসিস নাহ তোর জীবন এক থাপ্পড়ে শেষ করে দিবো`,
  `${targetName} তর মতো BTS ফ্যান আমাদের পা চেটে খায় আর তুই আমাদের সাথে লাগতে আসোস-!!😹😈`,
  `${targetName} আমাদের নামে উল্টো পালটা কথা বইলা তর জীবন নিয়ে টানা টানি করিস নাহ-!!😹`,
  `${targetName} আমাদের পা চেটে খাওয়া পোলা পাইন আমাদের সাথে লাগতে আসবি-!!😈🤬`,
  `${targetName} বাইমানি করি তাও আবার আমাদের সাথে তর নাম পরিবর্তন করে দিমু আসিস আমাদের এই খানে-!!😹`,
  `${targetName} দিন রাত নেসা পানি খারাপ কাজ করে তুই বলিস মুমিন বান্দা-!!😹`,
  `${targetName} তর মতো নাফরমানি বান্ধা আমাদের বাল এর জজ্ঞ নাহ-!!😹`,
  `${targetName} তুই খারাপ কাজ করে আমাদের সাথে লাগতে আসবি তর হার গুরো করে দিবো-!!🦴😹`,
  `${targetName} গালা গালি করবি তো মুখ শিলাই করে দিমহ-!!😁😷।`,
  `${targetName} তোর মুখে ভাতরুমের গন্ধ যা আগে দাত মেঝে আয় পরে কথা বলিস-!!😁`,
  `${targetName} তুই লাগবি আমাদের সাথে আসিস তোর জা আছে এখন পরে তা নিয়েও ফিরতে পারবি নাহ-!!😁`,
  `${targetName} বাস্ট্রাড এর বাচ্ছা বস্তির পোলা-!!🤧🤮`,
  "তর মা বাবার জারজ শন্তান-!!🤬😈",
  `${targetName} তর মতো BTS ফ্যান পশুর থেকে নিক্রিসঠো-!!😈`,
  `${targetName} তর জন্মদাতা রাস্তার কুত্তা-!!🤧😹`,
  `${targetName} তুই কিত্তা তাই কুত্তার মতো শুধু গেও গেও করস-!!😹`,
  `${targetName} তোর হয়তো জানা নেই ইসলাম কি জিনিস ইসলাম এর পাওয়ার কতো টুকু-!!😎⚡⛈️`,
  `${targetName} সেই দিন কার কামলা পলা পাইন-!!😁`,
  `${targetName} জুয়ারি গাঞ্জুটি পোলা পাইন ইসলামিক গ্রুপ এ থাকার জজ্ঞ নাহ-!!🤬`,
  `${targetName} বস্তির ছেলে অনলাইনের কিং-!!😹`,
  `${targetName} তুই টোকাই কিং-!!😹`,
  `${targetName} টাকার অভাবে মরা গরু খাস-!!😹`,
  `${targetName} টোকাই সেলিব্রেটি-!!😹`,
  `${targetName} ভাত খাইবার ভাত পাস না আর কথা বলতে আসোস আমাদের সাথে-!!😹`,
  `${targetName} ফকিন্নি পোলাপান-!!😹`,
  `${targetName} বস্তিরন্দালাল এর বাচ্ছা বস্তির পোলা-!!😹`,
  "জারজ শন্তান জা ভাগ-!!😹😈",
  `${targetName} hare is বস্তি পোলা-!!😹`,
  `${targetName} বান্তেয়ামি করার জায়গা পাস না-!!🤬`,
  `${targetName} লাগতে আসিস নাহ ভারচুয়াল জগত হারাম করে দিমু-!!🤬😈`,
  `${targetName} আব্বা ডাক তাহলে মানুষ হবার ট্রিক বলে দিমু-!!😹`,
  `${targetName} আর বাপের সাথে লাগতে আসবি-!!😾😈`,
  `${targetName} ঠাপ খাবি বাপ চিনবি-!!😹😈`,
  `${targetName} তেরামি করবি গার মটকে দিবো-!!🤬😈`,
  `${targetName} বারা বারি করবি তর বন রে নিয়ে পালাবো-!!🤧😈`,
  `${targetName} বারা বারি করবি তোর মুখে হাইগ্যা দিমু-!!🤮😹`,
  `${targetName} পাকনাকি করবি গু এর সাগরে ডুবাইয়া মারমু-!!😹🤮`,
  `${targetName} তর রাতে আকাম করার ভিডিও ভাইরাল করে দিমু বারা বারি করবি তো-!!😹🤧`,
  `${targetName} বেয়াদব দের সাথে কথা বলতে চাই না দূরে যাইয়া মর-!!🤧🤮`,
  `${targetName} বেশি কাহিনি করবি তর বন রে নিয়ে কাহিনি বানিয়ে দিমু-!!😹`,
  "তুই কই তর বন এর টুনটুনি সই-!!😹🥵",
  `${targetName} পালাইস নাহ পালাইস নাহ এমন ঠাপ দিমু পালানো জায়গায় পাবি না-!!😹`,
  `${targetName} তোর চিকোন সুন্দরী বন কে উম্মাহ-!!😹💋`,
  `${targetName} বারি বারি করবি তোর বউ রে নিয়ে খেলমু পাট খেতে নিয়ে-!!😹`,
  `${targetName} গালা গালি ৪২০ পাতার নাম পুদিনা তো মতো কা।লা পোলা পাইন চু**না-!!😈😹`,
  `${targetName} হট করে দিমু তর বন রে তেরামি করবি তো-!!😹🥵।`,
  `${targetName} ৯৯৯ এই নুম্বার এ কল দে তর বন রে কিডনাপ করমু-!!😹`,
  `${targetName} তেরিং বেরিং করবি তো তর গুসঠি গারমু-!!😹🤬`,
  `${targetName} গু খাওরা BTS ফ্যান-!!🤮😹`,
  `${targetName} তেল মজামু আসিস-!!😹🤬`,
  `${targetName} ওজান কুজাত এর জায়গা নাই আমার সহরে-!!🤬😈`,
  `${targetName} তর মতাও BTS ফ্যান আমাদের সাথে লাগতে আসছে বাহ-!!😹`,
  `${targetName} BTS ফ্যান এর বাচ্চা হিজলার সাথে তার কাতা-!!🤬🥵`,
  `${targetName} BTS ফ্যান এর বাচ্চা এমন ঠাপ দিমু তোর বন রে শুধা লারাইয়া ফেলমু-!!😈🤬`,
  "তেরিং বেতিং করবি তোর বন এর জৌবোন নষ্ট করে দিমু-!!🥵😹",
  "তর মার সাথে রাতে আকাম করগা ভালো না লাগলে-!!🥵🤬",
  "কিং অফ ফকিন্নির পলা-!!✌️😈",
  "কিং অফ ঘু খোর টোকাই পোলা-!!✌️😈",
  "যারা bts fan তাদেরকে Rahat boss👉👌🫦"
] ;

  // 🔥 লোডিং এনিমেশন
  api.sendMessage("▒▒▒▒▒▒▒▒▒▒ 0%", threadID, (err, info) => {
	if (err) return console.error(err);
	const progressMsgID = info.messageID;

	let step = 0;
	const interval = 100; // স্পিডি

	const progressInterval = setInterval(() => {
  	step += 1;
  	if (step > 10) {
    	clearInterval(progressInterval);

    	// সবশেষে মেসেজ ডিলিট + মূল প্রসেস চালু
    	setTimeout(async () => {
      	api.unsendMessage(progressMsgID);

      	let idx = 0;
      	await api.sendMessage(
        	{ body: messages[idx], mentions: [{ tag: targetName, id: targetID }] },
        	threadID
      	);

      	const intervalId = setInterval(() => {
        	idx = (idx + 1) % messages.length;
        	api.sendMessage(
          	{ body: messages[idx], mentions: [{ tag: targetName, id: targetID }] },
          	threadID
        	);
      	}, 2400); // এখন ৩ সেকেন্ডে মেসেজ যাবে

      	global.clientIntervals[threadID] = intervalId;

    	}, 500);
    	return;
  	}

  	const filled = "█".repeat(step);
  	const empty = "▒".repeat(10 - step);
  	const percent = step * 10;
  	api.editMessage(`${filled}${empty} ${percent}%`, progressMsgID, threadID);

	}, interval);
  });
};

// Stop command (ভুলে গেলে বন্ধ করার জন্য)
module.exports.stop = async function({ api, event }) {
  const threadID = event.threadID;

  if (global.clientIntervals && global.clientIntervals[threadID]) {
	clearInterval(global.clientIntervals[threadID]);
	delete global.clientIntervals[threadID];
	return api.sendMessage("রিপিট বন্ধ করা হয়েছে 🐸", threadID);
  } else {
	return api.sendMessage("এই চ্যাটে কোনো রিপিট চলছে না।", threadID);
  }
};
