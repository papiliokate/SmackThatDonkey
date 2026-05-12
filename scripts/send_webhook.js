const url = "https://hooks.zapier.com/hooks/catch/27231889/ujm5mjh/";
const payload = {
    video_url: "https://smack-that-donkey.web.app/Smack%20My%20Donkey%20John%20%23smackthat%20%23oopsgames.mp4",
    text: "Smack My Donkey John #smackthat #oopsgames",
    youtube_title: "Smack My Donkey John #smackthat #oopsgames",
    target_channel: "all"
};

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
}).then(res => {
    console.log("Zapier responded with status:", res.status);
    return res.text();
}).then(text => {
    console.log("Response:", text);
}).catch(err => {
    console.error("Error sending to Zapier:", err);
});
