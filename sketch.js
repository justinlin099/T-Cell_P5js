let messages = [];
let phoneIcon; // 手機圖示
let socket; // WebSocket 連線

function preload() {
  phoneIcon = loadImage("phone-icon.png"); // 載入手機圖示
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(36);
  frameRate(60);
  textAlign(CENTER, CENTER);

  // 建立 WebSocket 連線
  socket = new WebSocket('ws://localhost:8080'); // 連接到 WebSocket 伺服器

  socket.onopen = () => {
    console.log('Connected to WebSocket server');
  };

  socket.onmessage = event => {
    console.log(`Received from server: ${event.data}`);
    if (event.data instanceof Blob) {
      let reader = new FileReader();
      reader.onload = () => {
        messages.push(new Message(reader.result, random(width), random(height - 150)));
      };
      reader.readAsText(event.data);
    } else {
      messages.push(new Message(event.data, random(width), random(height - 150)));
    }
  };

  socket.onclose = () => {
    console.log('Disconnected from WebSocket server');
  };

  socket.onerror = error => {
    console.error('WebSocket error:', error);
  };
}

function draw() {
  background(220);

  for (let i = 0; i < messages.length; i++) {
    let message = messages[i];
    message.update();
    message.display();

    if (message.isOffScreen()) {
      messages.splice(i, 1);
      i--;
    }
  }

  // 繪製底部漸層
  drawGradient();

  // 顯示邀請文字和圖示
  displayInvitation();
}

class Message {
  constructor(content, x, y) {
    this.content = content;
    this.x = x;
    this.y = y;
    this.alpha = 255;
    this.scale = 0.1;
    this.boxColor = this.generateDarkColor();
    this.lifeTime = 12000;
    this.fadeDelay = 60;
    this.triangleOffset = random([-1, 1]);
    this.scaleTime = 0;
    this.maxTextWidth = 200;
    this.lines = this.splitTextIntoLines(content, this.maxTextWidth);
    this.padding = 20;
  }

  generateDarkColor() {
    let r = random(100);
    let g = random(100);
    let b = random(100);
    return color(r, g, b);
  }

  update() {
    this.lifeTime--;
    this.scaleTime++;
    this.scale = this.easeOutBack(min(1, this.scaleTime / 20));
    if (this.lifeTime <= this.fadeDelay) {
      this.alpha = max(0, this.alpha - 2);
    }
  }

  easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  splitTextIntoLines(text, maxWidth) {
    let lines = [];
    let currentLine = "";

    for (let i = 0; i < text.length; i++) {
      let testLine = currentLine + text[i];
      if (textWidth(testLine) > maxWidth) {
        lines.push(currentLine);
        currentLine = text[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  display() {
    let padding = 20;
    let cornerRadius = 10;
    let triangleSize = 10;

    push();
    translate(this.x, this.y);
    scale(this.scale);

    // 計算文字方塊的寬度和高度
    let maxLineWidth = 0;
    for (let i = 0; i < this.lines.length; i++) {
      maxLineWidth = max(maxLineWidth, textWidth(this.lines[i]));
    }
    let textHeightVal = this.lines.length * (textAscent() + textDescent());

    // 繪製圓角矩形
    let boxColorWithAlpha = color(red(this.boxColor), green(this.boxColor), blue(this.boxColor), this.alpha);
    fill(boxColorWithAlpha);
    noStroke();
    rect(
      -maxLineWidth / 2 - padding,
      -textHeightVal / 2 - padding,
      maxLineWidth + 2 * padding,
      textHeightVal + 2 * padding,
      cornerRadius
    );

    // 計算小角偏移量
    let maxOffset = maxLineWidth / 2 + padding - cornerRadius - triangleSize;
    let triangleOffset = this.triangleOffset * maxOffset;

    // 繪製突起
    triangle(
      triangleOffset,
      textHeightVal / 2 + padding + triangleSize,
      triangleSize + triangleOffset,
      textHeightVal / 2 + padding,
      -triangleSize + triangleOffset,
      textHeightVal / 2 + padding
    );

    // 判斷文字框亮度並設定文字顏色
    let brightness = lightness(this.boxColor);
    let textColor = brightness > 128 ? color(0, this.alpha) : color(255, this.alpha);

    // 顯示文字
    fill(textColor);
    textAlign(LEFT, TOP);
    for (let i = 0; i < this.lines.length; i++) {
      text(this.lines[i], -maxLineWidth / 2, -textHeightVal / 2 + i * (textAscent() + textDescent()));
    }

    pop();
  }

  isOffScreen() {
    return this.alpha <= 0;
  }
}

function displayInvitation() {
  let invitationText = "使用手機傳送訊息看看！";
  let iconSize = 70;
  let textY = height - 120;
  let iconY = textY - iconSize - 20;

  // 顯示文字
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text(invitationText, width / 2, textY);

  // 顯示圖示
  push();
  phoneIcon.mask(phoneIcon);
  fill(255);
  image(phoneIcon, width / 2 - iconSize / 2, iconY, iconSize, iconSize);
  pop();
}

function drawGradient() {
  let gradientHeight = 150;
  let startColor = color(50, 0);
  let endColor = color(50);

  for (let i = 0; i < gradientHeight; i++) {
    let inter = map(i, 0, gradientHeight, 0, 1);
    let c = lerpColor(startColor, endColor, inter);
    stroke(c);
    line(0, height - gradientHeight + i, width, height - gradientHeight + i);
  }
  noStroke();
}