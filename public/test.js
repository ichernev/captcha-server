function refresh(type) {
    type = type || 'svg';
    fetch('/generate?type=' + encodeURIComponent(type)).then((res) => {
        return res.json();
    }).then((obj) => {
        let inner;
        if (type === 'svg') {
            inner = obj.svg;
        } else {
            inner = `<img src="data:image/png;base64, ${obj.png}" alt="captcha" />`;
        }
        document.getElementById('captcha').innerHTML = inner;
        document.getElementById('hmac').innerHTML = obj.hmac;
        document.getElementById('verify-msg').innerHTML = '';
        document.getElementById('guess').value = '';
    });
}

window.onload = function() {
    document.body.innerHTML = `
        <h1>Test Captcha</h1>
        <div id="captcha"></div>
        <span>hmac: </span><pre id="hmac" style="display: inline"></pre>
        <div style="clear: both"></div>
        <input type="text" placeholder="enter guess" id="guess"></input>
        <button id="verify">verify</button>
        <button id="refresh">refresh</button>
        <button id="refresh-png">refresh PNG</button>
        <div id="verify-msg"></div>
    `;

    document.getElementById('verify').addEventListener('click', (ev) => {
        const guess = document.getElementById('guess').value;
        const hmac = document.getElementById('hmac').innerHTML;
        console.log(`verifying ${guess} ${hmac}`);
        fetch(`/verify?guess=${encodeURIComponent(guess)}&hmac=${encodeURIComponent(hmac)}`).then((res) => {
            document.getElementById('verify-msg').innerHTML = res.ok ? 'GOOD' : 'BAD';
        });
    });

    document.getElementById('refresh').addEventListener('click', (ev) => refresh());
    document.getElementById('refresh-png').addEventListener('click', (ev) => refresh('png'));

    refresh();
}

