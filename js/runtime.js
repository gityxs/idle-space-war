window.runtimeLoop = (dotnetHelper) => {
    let lastTime = performance.now();

    function loop(time) {
        let deltaTime = time - lastTime;
        lastTime = time;

        // console.log("Calling OnFrame"); // ← 追加
        dotnetHelper.invokeMethodAsync("OnFrame", deltaTime)
            .catch(error => console.error("OnFrame呼び出しエラー:", error));

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
};
