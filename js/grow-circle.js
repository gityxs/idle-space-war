window['grow-circle'] = {
    startAnimation: function () {
        var canvas = document.getElementById("myCanvas");
        if (!canvas.getContext) return;
        var ctx = canvas.getContext("2d");

        // キャンバス中央の座標
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;

        // 成長速度（毎秒5px）
        var growthRate = 5;
        // 回転速度（ラジアン/フレーム）
        var speed = 0.02;
        // 共通の回転角度
        var angle = 0;

        // 2つの円をオブジェクトで管理
        // 初期状態：円A（もともと大きかった方、固定円）: 半径40px
        //           円B（もともと小さかった方、回転円）: 半径20px
        var circleA = {radius: 40};
        var circleB = {radius: 20};

        // 状態管理：fixed（固定円）と rotating（回転円）
        var fixed = circleA;       // 初期状態では円Aが固定
        var rotating = circleB;    // 円Bが回転しながら成長

        // 成長タイマー：回転円の成長開始時刻と初期半径を記録
        var growthStartTime = null;
        var initialRotatingRadius = rotating.radius;

        function animate(timestamp) {
            // 初回または役割入れ替え直後はタイマーをリセット
            if (growthStartTime === null) {
                growthStartTime = timestamp;
                initialRotatingRadius = rotating.radius;
            }

            // 経過時間（秒）
            var elapsed = (timestamp - growthStartTime) / 1000;
            // 回転円の新しい半径
            var newRotatingRadius = initialRotatingRadius + growthRate * elapsed;
            // 入れ替え条件：回転円の半径が固定円の直径に到達（固定円.radius * 2）
            var threshold = fixed.radius * 2;

            // 役割入れ替えのタイミングかチェック
            if (newRotatingRadius >= threshold) {
                // 現フレームは threshold の大きさで描画
                rotating.radius = threshold;

                // 描画処理（後述の共通描画と同等）
                draw(ctx, centerX, centerY, fixed, rotating, angle);

                // 役割を入れ替え：
                // 現在回転していた円（rotating）が固定円となり、
                // もともと固定円だった円（fixed）が新たに回転円となる
                var temp = fixed;
                fixed = rotating;
                rotating = temp;

                // 状態2において、新たな回転円の成長を開始するためタイマーリセット
                growthStartTime = timestamp;
                initialRotatingRadius = rotating.radius;
            } else {
                // 通常は回転円の半径を更新
                rotating.radius = newRotatingRadius;
            }

            // 各フレームで、円同士が接するように配置
            // 接するための距離は「固定円の半径 + 回転円の半径」
            var orbitDistance = fixed.radius + rotating.radius;
            var rotatingCenterX = centerX + orbitDistance * Math.cos(angle);
            var rotatingCenterY = centerY + orbitDistance * Math.sin(angle);

            // キャンバスをクリア
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 固定円を描画（常にキャンバス中央）
            ctx.beginPath();
            ctx.arc(centerX, centerY, fixed.radius, 0, Math.PI * 2, true);
            ctx.stroke();

            // 回転円を描画
            ctx.beginPath();
            ctx.arc(rotatingCenterX, rotatingCenterY, rotating.radius, 0, Math.PI * 2, true);
            ctx.stroke();

            // 共通で回転角度を更新
            angle += speed;
            requestAnimationFrame(animate);
        }

        // 補助関数：描画（役割入れ替え時の即時描画用）
        function draw(ctx, cx, cy, fixedCircle, rotatingCircle, currentAngle) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // 固定円（キャンバス中央）
            ctx.beginPath();
            ctx.arc(cx, cy, fixedCircle.radius, 0, Math.PI * 2, true);
            ctx.stroke();
            // 回転円（固定円との接点を維持）
            var dist = fixedCircle.radius + rotatingCircle.radius;
            var rcx = cx + dist * Math.cos(currentAngle);
            var rcy = cy + dist * Math.sin(currentAngle);
            ctx.beginPath();
            ctx.arc(rcx, rcy, rotatingCircle.radius, 0, Math.PI * 2, true);
            ctx.stroke();
        }

        requestAnimationFrame(animate);
    }
}
