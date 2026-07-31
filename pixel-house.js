window.RochePlugin.register({
  id: "pixel-house",
  name: "像素小屋",
  version: "2.0.0",
  apps: [
    {
      id: "pixel-house-home",
      name: "像素小屋",
      icon: "home",
      iconImage: "",
      async mount(container, roche) {
        const GRID_W = 36
        const GRID_H = 26
        const PIXEL_SIZE = 16
        const CHAR_BASE_X = 16
        const CHAR_BASE_Y = 25
        const DEFAULT_SPRITE_W = 8
        const DEFAULT_SPRITE_H = 12

        const WALL_PRESETS = [
          { name: "暗夜海军", color: "#1a1a2e", accent: "#16213e" },
          { name: "深灰条纹", color: "#2d3748", accent: "#374151" },
          { name: "柔粉", color: "#f5e6e8", accent: "#e8d5d8" },
          { name: "奶油白", color: "#faf8f5", accent: "#f0ebe3" },
          { name: "墨绿", color: "#1e3832", accent: "#2a4a3e" }
        ]

        const FLOOR_PRESETS = [
          { name: "浅木色", color: "#d4c5b2", accent: "#c4b5a2" },
          { name: "深木色", color: "#5c4033", accent: "#4a3328" },
          { name: "白瓷砖", color: "#e8e8e8", accent: "#d4d4d4" },
          { name: "灰水泥", color: "#9ca3af", accent: "#8b939f" }
        ]

        const PALETTE = {
          // 天花板
          ceiling: "#1a1d23",
          ceiling_line: "#2d3139",
          // 踢脚线
          baseboard: "#3d2e27",
          baseboard_top: "#4d3e37",
          // 窗户
          window_frame: "#4a3728",
          window_glass_day: "#7ec8e3",
          window_glass_night: "#1a2a4a",
          // 家具
          desk_top: "#5c3d2e",
          desk_leg: "#3d2a1e",
          desk_drawer: "#4a3020",
          monitor_screen: "#1a1a2e",
          monitor_frame: "#2d2d2d",
          monitor_stand: "#3d3d3d",
          monitor_glow: "#4a7cff",
          chair_seat: "#6b4c3b",
          chair_leg: "#3d2a1e",
          // 书架
          shelf_board: "#5c4033",
          shelf_side: "#4a3020",
          // 书
          book_red: "#c0392b",
          book_blue: "#2980b9",
          book_green: "#27ae60",
          book_purple: "#8e44ad",
          book_yellow: "#f1c40f",
          book_orange: "#e67e22",
          book_pink: "#e91e63",
          book_white: "#ecf0f1",
          // 公告板
          cork: "#c8a96e",
          cork_frame: "#8b6914",
          // 地毯
          rug_main: "#7c3aed",
          rug_border: "#5b21b6",
          rug_pattern: "#a78bfa",
          // 垃圾桶
          bin_color: "#374151",
          bin_lid: "#4b5563",
          // 落地灯
          lamp_stand: "#374151",
          lamp_shade: "#fef3c7",
          lamp_glow: "#fde047",
          // 盆栽
          pot: "#d97706",
          pot_soil: "#5c4033",
          plant_green: "#15803d",
          plant_light: "#22c55e",
          // 猫
          cat_orange: "#fb923c",
          cat_white: "#f8fafc",
          cat_black: "#1f2937",
          // 挂钟
          clock_frame: "#374151",
          clock_face: "#f9fafb",
          // 海报
          poster_bg: "#f5f0e8",
          poster_border: "#374151",
          // 门
          door_frame: "#5c4033",
          door_panel: "#7c5c43",
          door_knob: "#fbbf24",
          // 插座
          outlet: "#e5e7eb"
        }

        const EDITOR_PALETTE = [
          null, "#000000", "#ffffff", "#6b7280", "#9ca3af", "#d1d5db",
          "#8d5524", "#c68863", "#e8b796", "#f5a58a", "#fdbab4",
          "#1f2937", "#422006", "#78350f", "#ca8a04", "#facc15", "#fde047",
          "#dc2626", "#ef4444", "#f97316", "#fb923c", "#fdba74",
          "#16a34a", "#22c55e", "#4ade80", "#86efac",
          "#0891b2", "#06b6d4", "#22d3ee", "#67e8f9",
          "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd",
          "#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd",
          "#db2777", "#ec4899", "#f472b6", "#f9a8d4",
          "#1e3a5f", "#0f172a", "#fde68a", "#fcd34d"
        ]

        // ==================== 状态 ====================
        let state = {
          wallPreset: 0,
          floorPreset: 0,
          isNight: false,
          lightOn: true,
          catX: 2,
          catY: 23,
          catDir: 1,
          catColor: "orange",
          characterSprite: null,
          characterName: "",
          stars: []
        }

        try {
          const saved = await roche.storage.get("pixelHouseState")
          if (saved) state = { ...state, ...saved }
        } catch (e) {}

        for (let i = 0; i < 8; i++) {
          state.stars.push({
            x: 14 + Math.floor(Math.random() * 6),
            y: 3 + Math.floor(Math.random() * 6),
            blink: Math.random() > 0.5
          })
        }

        let charBob = 0
        let charJumping = false
        let jumpFrame = 0
        let workingSprite = null
        let selectedColor = "#1f2937"
        let editorMode = "paint"

        // ==================== 样式 ====================
        const styleEl = document.createElement("style")
        styleEl.textContent = `
          .roche-plugin-pixel-house {
            width: 100%; height: 100%;
            background: #1a1d23;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            overflow: auto;
            font-family: "Courier New", monospace;
            position: relative;
          }
          .roche-plugin-pixel-house .pixel-canvas {
            display: grid;
            grid-template-columns: repeat(${GRID_W}, ${PIXEL_SIZE}px);
            grid-template-rows: repeat(${GRID_H}, ${PIXEL_SIZE}px);
            gap: 0; border: 4px solid #2d3139;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            cursor: pointer; user-select: none;
          }
          .roche-plugin-pixel-house .pixel {
            width: ${PIXEL_SIZE}px; height: ${PIXEL_SIZE}px;
            transition: background-color 0.25s ease;
          }
          .roche-plugin-pixel-house .pixel:hover { filter: brightness(1.15); }
          .roche-plugin-pixel-house .controls {
            margin-top: 14px; display: flex; gap: 10px;
            align-items: center; flex-wrap: wrap; justify-content: center;
          }
          .roche-plugin-pixel-house .btn {
            padding: 7px 14px; border: 2px solid #4a5568;
            background: #2d3748; color: #e2e8f0;
            font-family: inherit; font-size: 13px; font-weight: bold;
            cursor: pointer; border-radius: 4px;
            transition: all 0.15s ease;
          }
          .roche-plugin-pixel-house .btn:hover {
            background: #4a5568; border-color: #718096;
          }
          .roche-plugin-pixel-house .btn:active {
            background: #1a202c;
          }
          .roche-plugin-pixel-house .btn.accent {
            background: #7c3aed; border-color: #6d28d9;
          }
          .roche-plugin-pixel-house .btn.accent:hover { background: #8b5cf6; }
          .roche-plugin-pixel-house .hint {
            margin-top: 10px; color: #6b7280; font-size: 11px;
            text-align: center; line-height: 1.5;
          }
          .roche-plugin-pixel-house .title {
            font-size: 22px; font-weight: bold; color: #e2e8f0;
            margin-bottom: 10px;
          }
          .roche-plugin-pixel-house .close-btn {
            position: absolute; top: 10px; right: 10px;
            width: 34px; height: 34px;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid #4a5568; background: #2d3748;
            cursor: pointer; font-size: 16px; font-weight: bold;
            color: #e2e8f0; border-radius: 4px; z-index: 10;
          }
          .roche-plugin-pixel-house .close-btn:hover { background: #4a5568; }

          .roche-plugin-pixel-house .char-overlay {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); display: none;
            align-items: center; justify-content: center;
            z-index: 100; padding: 16px;
          }
          .roche-plugin-pixel-house .char-overlay.active { display: flex; }
          .roche-plugin-pixel-house .char-modal {
            background: #1e2130; border: 2px solid #4a5568;
            border-radius: 8px;
            max-width: 560px; width: 100%; max-height: 85vh;
            overflow-y: auto; padding: 20px; color: #e2e8f0;
          }
          .roche-plugin-pixel-house .char-modal-header {
            display: flex; justify-content: space-between;
            align-items: center; margin-bottom: 16px;
          }
          .roche-plugin-pixel-house .char-modal-title {
            font-size: 18px; font-weight: bold;
          }
          .roche-plugin-pixel-house .char-modal-close {
            width: 32px; height: 32px;
            border: 2px solid #4a5568; background: #2d3748;
            cursor: pointer; font-size: 16px; font-weight: bold; color: #e2e8f0;
            border-radius: 4px;
          }
          .roche-plugin-pixel-house .char-tabs {
            display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
          }
          .roche-plugin-pixel-house .char-tab {
            padding: 6px 14px; border: 2px solid #4a5568;
            background: #2d3748; cursor: pointer;
            font-family: inherit; font-size: 13px; font-weight: bold; color: #e2e8f0;
            border-radius: 4px;
          }
          .roche-plugin-pixel-house .char-tab.active {
            background: #7c3aed; border-color: #6d28d9;
          }
          .roche-plugin-pixel-house .char-tab-content { display: none; }
          .roche-plugin-pixel-house .char-tab-content.active { display: block; }
          .roche-plugin-pixel-house .char-list {
            display: flex; flex-direction: column; gap: 8px;
            max-height: 320px; overflow-y: auto;
          }
          .roche-plugin-pixel-house .char-item {
            display: flex; align-items: center; gap: 12px;
            padding: 8px; border: 2px solid #374151;
            background: #2d3748; cursor: pointer; border-radius: 4px;
          }
          .roche-plugin-pixel-house .char-item:hover {
            border-color: #7c3aed; background: #374151;
          }
          .roche-plugin-pixel-house .char-item-avatar {
            width: 40px; height: 40px; border-radius: 4px;
            object-fit: cover; background: #1a1d23;
          }
          .roche-plugin-pixel-house .char-item-placeholder {
            width: 40px; height: 40px; border-radius: 4px;
            background: #1a1d23; display: flex; align-items: center;
            justify-content: center; font-size: 18px; font-weight: bold; color: #6b7280;
          }
          .roche-plugin-pixel-house .char-item-name { font-size: 14px; font-weight: bold; }
          .roche-plugin-pixel-house .char-item-handle { font-size: 12px; color: #9ca3af; }
          .roche-plugin-pixel-house .upload-area {
            display: flex; flex-direction: column; gap: 12px;
          }
          .roche-plugin-pixel-house .upload-btn-wrapper {
            position: relative; overflow: hidden; display: inline-block;
          }
          .roche-plugin-pixel-house .upload-btn {
            padding: 8px 16px; border: 2px solid #4a5568;
            background: #2d3748; cursor: pointer;
            font-family: inherit; font-size: 14px; font-weight: bold; color: #e2e8f0;
            border-radius: 4px; display: inline-block;
          }
          .roche-plugin-pixel-house .upload-btn:hover { background: #4a5568; }
          .roche-plugin-pixel-house .upload-btn-wrapper input[type=file] {
            position: absolute; top: 0; left: 0; opacity: 0;
            width: 100%; height: 100%; cursor: pointer;
          }
          .roche-plugin-pixel-house .size-controls {
            display: flex; gap: 16px; align-items: center; flex-wrap: wrap;
          }
          .roche-plugin-pixel-house .size-control {
            display: flex; flex-direction: column; gap: 4px;
          }
          .roche-plugin-pixel-house .size-control label { font-size: 12px; color: #9ca3af; }
          .roche-plugin-pixel-house .size-control input[type=range] { width: 120px; }
          .roche-plugin-pixel-house .size-value { font-size: 14px; font-weight: bold; }
          .roche-plugin-pixel-house .upload-preview {
            margin-top: 8px; padding: 12px; border: 2px dashed #4a5568;
            background: #1a1d23; text-align: center; min-height: 60px;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; color: #6b7280; border-radius: 4px;
          }
          .roche-plugin-pixel-house .editor-section {
            display: flex; flex-direction: column; gap: 12px;
          }
          .roche-plugin-pixel-house .editor-controls {
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
          }
          .roche-plugin-pixel-house .editor-size-input {
            width: 50px; padding: 4px; border: 2px solid #4a5568;
            font-family: inherit; font-size: 13px; background: #1a1d23; color: #e2e8f0;
            border-radius: 4px;
          }
          .roche-plugin-pixel-house .editor-grid-wrapper {
            overflow: auto; max-width: 100%; padding: 8px;
            background: #111; border: 2px solid #4a5568; border-radius: 4px;
          }
          .roche-plugin-pixel-house .editor-grid { display: grid; gap: 0; }
          .roche-plugin-pixel-house .editor-cell {
            width: 22px; height: 22px; cursor: pointer;
            box-sizing: border-box; border: 1px solid #333;
          }
          .roche-plugin-pixel-house .editor-cell.transparent {
            background-image:
              linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%),
              linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%);
            background-size: 8px 8px;
            background-position: 0 0, 4px 4px;
            background-color: #1a1a1a;
          }
          .roche-plugin-pixel-house .editor-palette {
            display: flex; flex-wrap: wrap; gap: 4px;
            padding: 8px; background: #111; border: 2px solid #4a5568; border-radius: 4px;
          }
          .roche-plugin-pixel-house .palette-swatch {
            width: 24px; height: 24px; cursor: pointer;
            border: 2px solid #4a5568; box-sizing: border-box; border-radius: 2px;
          }
          .roche-plugin-pixel-house .palette-swatch.selected {
            border: 3px solid #f59e0b; box-shadow: 0 0 0 2px #1a1d23;
          }
          .roche-plugin-pixel-house .palette-swatch.eraser {
            background-image:
              linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%),
              linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%);
            background-size: 8px 8px; background-position: 0 0, 4px 4px;
            background-color: #1a1a1a;
          }
          .roche-plugin-pixel-house .editor-tools { display: flex; gap: 8px; }
          .roche-plugin-pixel-house .tool-btn {
            padding: 4px 12px; border: 2px solid #4a5568;
            background: #2d3748; cursor: pointer;
            font-family: inherit; font-size: 12px; font-weight: bold; color: #e2e8f0;
            border-radius: 4px;
          }
          .roche-plugin-pixel-house .tool-btn.active { background: #7c3aed; border-color: #6d28d9; }
          .roche-plugin-pixel-house .char-footer {
            margin-top: 16px; display: flex; gap: 8px;
            align-items: center; flex-wrap: wrap;
          }
          .roche-plugin-pixel-house .char-name-input {
            flex: 1; min-width: 120px; padding: 6px 10px;
            border: 2px solid #4a5568; font-family: inherit; font-size: 14px;
            background: #1a1d23; color: #e2e8f0; border-radius: 4px;
          }
          .roche-plugin-pixel-house .char-loading {
            text-align: center; padding: 20px; color: #6b7280; font-size: 14px;
          }
          .roche-plugin-pixel-house .char-error {
            text-align: center; padding: 20px; color: #ef4444; font-size: 14px;
          }
          .roche-plugin-pixel-house .char-empty {
            text-align: center; padding: 20px; color: #6b7280; font-size: 14px;
          }
          .roche-plugin-pixel-house .preset-row {
            display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;
          }
          .roche-plugin-pixel-house .preset-swatch {
            width: 40px; height: 40px; cursor: pointer;
            border: 2px solid #4a5568; border-radius: 4px;
            position: relative; overflow: hidden;
          }
          .roche-plugin-pixel-house .preset-swatch.active {
            border-color: #7c3aed; box-shadow: 0 0 0 2px #7c3aed;
          }
          .roche-plugin-pixel-house .preset-label {
            font-size: 10px; color: #9ca3af; text-align: center; margin-top: 2px;
          }
          @keyframes twinkle { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
          .roche-plugin-pixel-house .star-anim { animation: twinkle 2s ease-in-out infinite; }
          @keyframes cat-walk { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
          .roche-plugin-pixel-house .cat-anim { animation: cat-walk 0.3s ease-in-out infinite; }
          @keyframes monitor-flicker { 0%,100% { opacity: 1; } 95% { opacity: 1; } 97% { opacity: 0.5; } }
          .roche-plugin-pixel-house .monitor-anim { animation: monitor-flicker 4s ease-in-out infinite; }
        `
        document.head.appendChild(styleEl)

        // ==================== DOM 结构 ====================
        const wallPreset = WALL_PRESETS[state.wallPreset]
        const floorPreset = FLOOR_PRESETS[state.floorPreset]

        const root = document.createElement("div")
        root.className = "roche-plugin-pixel-house"

        const closeBtn = document.createElement("button")
        closeBtn.className = "close-btn"
        closeBtn.textContent = "×"
        closeBtn.onclick = () => roche.ui.closeApp()
        root.appendChild(closeBtn)

        const title = document.createElement("div")
        title.className = "title"
        title.textContent = "像素小屋"
        root.appendChild(title)

        const canvas = document.createElement("div")
        canvas.className = "pixel-canvas"
        root.appendChild(canvas)

        // 控制按钮
        const controls = document.createElement("div")
        controls.className = "controls"

        const lightBtn = document.createElement("button")
        lightBtn.className = "btn accent"
        lightBtn.textContent = state.lightOn ? "💡 关灯" : "💡 开灯"
        lightBtn.onclick = toggleLight
        controls.appendChild(lightBtn)

        const wallBtn = document.createElement("button")
        wallBtn.className = "btn"
        wallBtn.textContent = "🖼️ 换墙纸"
        wallBtn.onclick = cycleWallpaper
        controls.appendChild(wallBtn)

        const floorBtn = document.createElement("button")
        floorBtn.className = "btn"
        floorBtn.textContent = "🪵 换地板"
        floorBtn.onclick = cycleFloor
        controls.appendChild(floorBtn)

        const charBtn = document.createElement("button")
        charBtn.className = "btn"
        charBtn.textContent = state.characterSprite ? "👤 编辑角色" : "👤 添加角色"
        charBtn.onclick = openCharPanel
        controls.appendChild(charBtn)

        const catBtn = document.createElement("button")
        catBtn.className = "btn"
        catBtn.textContent = "🐱 换只猫咪"
        catBtn.onclick = changeCat
        controls.appendChild(catBtn)

        root.appendChild(controls)

        const hint = document.createElement("div")
        hint.className = "hint"
        hint.innerHTML = "点击窗户切换昼夜 · 点击角色打招呼 · 点击灯开关灯 · 点击猫咪换方向"
        root.appendChild(hint)

        // ==================== 角色弹窗（同 v1.1 结构） ====================
        const charOverlay = document.createElement("div")
        charOverlay.className = "char-overlay"
        const charModal = document.createElement("div")
        charModal.className = "char-modal"
        const charHeader = document.createElement("div")
        charHeader.className = "char-modal-header"
        const charModalTitle = document.createElement("div")
        charModalTitle.className = "char-modal-title"
        charModalTitle.textContent = "角色像素形象"
        charHeader.appendChild(charModalTitle)
        const charModalClose = document.createElement("button")
        charModalClose.className = "char-modal-close"
        charModalClose.textContent = "×"
        charModalClose.onclick = closeCharPanel
        charHeader.appendChild(charModalClose)
        charModal.appendChild(charHeader)
        const charTabs = document.createElement("div")
        charTabs.className = "char-tabs"
        const tabChars = document.createElement("button")
        tabChars.className = "char-tab active"
        tabChars.textContent = "角色列表"
        tabChars.onclick = () => switchTab("chars")
        charTabs.appendChild(tabChars)
        const tabUpload = document.createElement("button")
        tabUpload.className = "char-tab"
        tabUpload.textContent = "上传图片"
        tabUpload.onclick = () => switchTab("upload")
        charTabs.appendChild(tabUpload)
        const tabDraw = document.createElement("button")
        tabDraw.className = "char-tab"
        tabDraw.textContent = "手绘编辑"
        tabDraw.onclick = () => switchTab("draw")
        charTabs.appendChild(tabDraw)
        charModal.appendChild(charTabs)
        const contentChars = document.createElement("div")
        contentChars.className = "char-tab-content active"
        contentChars.innerHTML = '<div class="char-loading">加载中...</div>'
        charModal.appendChild(contentChars)
        const contentUpload = document.createElement("div")
        contentUpload.className = "char-tab-content"
        const uploadArea = document.createElement("div")
        uploadArea.className = "upload-area"
        const uploadBtnWrapper = document.createElement("div")
        uploadBtnWrapper.className = "upload-btn-wrapper"
        const uploadBtnLabel = document.createElement("div")
        uploadBtnLabel.className = "upload-btn"
        uploadBtnLabel.textContent = "📁 选择图片"
        const fileInput = document.createElement("input")
        fileInput.type = "file"
        fileInput.accept = "image/*"
        fileInput.onchange = handleFileUpload
        uploadBtnWrapper.appendChild(uploadBtnLabel)
        uploadBtnWrapper.appendChild(fileInput)
        uploadArea.appendChild(uploadBtnWrapper)
        const sizeControls = document.createElement("div")
        sizeControls.className = "size-controls"
        const widthControl = document.createElement("div")
        widthControl.className = "size-control"
        widthControl.innerHTML = "<label>像素宽度</label>"
        const widthSlider = document.createElement("input")
        widthSlider.type = "range"; widthSlider.min = "4"; widthSlider.max = "16"; widthSlider.value = String(DEFAULT_SPRITE_W)
        const widthValue = document.createElement("div")
        widthValue.className = "size-value"; widthValue.textContent = String(DEFAULT_SPRITE_W)
        widthSlider.oninput = () => widthValue.textContent = widthSlider.value
        widthControl.appendChild(widthSlider); widthControl.appendChild(widthValue)
        sizeControls.appendChild(widthControl)
        const heightControl = document.createElement("div")
        heightControl.className = "size-control"
        heightControl.innerHTML = "<label>像素高度</label>"
        const heightSlider = document.createElement("input")
        heightSlider.type = "range"; heightSlider.min = "6"; heightSlider.max = "20"; heightSlider.value = String(DEFAULT_SPRITE_H)
        const heightValue = document.createElement("div")
        heightValue.className = "size-value"; heightValue.textContent = String(DEFAULT_SPRITE_H)
        heightSlider.oninput = () => heightValue.textContent = heightSlider.value
        heightControl.appendChild(heightSlider); heightControl.appendChild(heightValue)
        sizeControls.appendChild(heightControl)
        uploadArea.appendChild(sizeControls)
        const uploadPreview = document.createElement("div")
        uploadPreview.className = "upload-preview"
        uploadPreview.textContent = "选择图片后自动像素化，可在「手绘编辑」中微调"
        uploadArea.appendChild(uploadPreview)
        contentUpload.appendChild(uploadArea)
        charModal.appendChild(contentUpload)
        const contentDraw = document.createElement("div")
        contentDraw.className = "char-tab-content"
        const editorSection = document.createElement("div")
        editorSection.className = "editor-section"
        const editorControlsEl = document.createElement("div")
        editorControlsEl.className = "editor-controls"
        editorControlsEl.innerHTML = "尺寸: "
        const editorWInput = document.createElement("input")
        editorWInput.type = "number"; editorWInput.className = "editor-size-input"; editorWInput.value = String(DEFAULT_SPRITE_W); editorWInput.min = "4"; editorWInput.max = "16"
        editorControlsEl.appendChild(editorWInput)
        editorControlsEl.appendChild(document.createTextNode(" × "))
        const editorHInput = document.createElement("input")
        editorHInput.type = "number"; editorHInput.className = "editor-size-input"; editorHInput.value = String(DEFAULT_SPRITE_H); editorHInput.min = "6"; editorHInput.max = "20"
        editorControlsEl.appendChild(editorHInput)
        const newSpriteBtn = document.createElement("button")
        newSpriteBtn.className = "btn"; newSpriteBtn.textContent = "新建"; newSpriteBtn.style.fontSize = "12px"; newSpriteBtn.style.padding = "4px 10px"
        newSpriteBtn.onclick = () => {
          const w = Math.max(4, Math.min(16, parseInt(editorWInput.value) || DEFAULT_SPRITE_W))
          const h = Math.max(6, Math.min(20, parseInt(editorHInput.value) || DEFAULT_SPRITE_H))
          workingSprite = createBlankSprite(w, h); buildEditorGrid()
        }
        editorControlsEl.appendChild(newSpriteBtn)
        const clearBtn2 = document.createElement("button")
        clearBtn2.className = "btn"; clearBtn2.textContent = "清空"; clearBtn2.style.fontSize = "12px"; clearBtn2.style.padding = "4px 10px"
        clearBtn2.onclick = () => {
          if (!workingSprite) return
          for (let y = 0; y < workingSprite.height; y++)
            for (let x = 0; x < workingSprite.width; x++)
              workingSprite.pixels[y][x] = null
          buildEditorGrid()
        }
        editorControlsEl.appendChild(clearBtn2)
        editorSection.appendChild(editorControlsEl)
        const editorTools = document.createElement("div")
        editorTools.className = "editor-tools"
        const paintToolBtn = document.createElement("button")
        paintToolBtn.className = "tool-btn active"; paintToolBtn.textContent = "✏️ 画笔"
        paintToolBtn.onclick = () => { editorMode = "paint"; paintToolBtn.classList.add("active"); eraseToolBtn.classList.remove("active") }
        editorTools.appendChild(paintToolBtn)
        const eraseToolBtn = document.createElement("button")
        eraseToolBtn.className = "tool-btn"; eraseToolBtn.textContent = "🧹 橡皮"
        eraseToolBtn.onclick = () => { editorMode = "erase"; eraseToolBtn.classList.add("active"); paintToolBtn.classList.remove("active") }
        editorTools.appendChild(eraseToolBtn)
        editorSection.appendChild(editorTools)
        const editorGridWrapper = document.createElement("div")
        editorGridWrapper.className = "editor-grid-wrapper"
        const editorGrid = document.createElement("div")
        editorGrid.className = "editor-grid"
        editorGridWrapper.appendChild(editorGrid)
        editorSection.appendChild(editorGridWrapper)
        const editorPalette = document.createElement("div")
        editorPalette.className = "editor-palette"
        EDITOR_PALETTE.forEach((color, idx) => {
          const swatch = document.createElement("div")
          swatch.className = "palette-swatch"
          if (color === null) { swatch.classList.add("eraser"); swatch.title = "透明/橡皮" }
          else { swatch.style.backgroundColor = color; swatch.title = color }
          swatch.onclick = () => {
            selectedColor = color; editorMode = color === null ? "erase" : "paint"
            document.querySelectorAll(".roche-plugin-pixel-house .palette-swatch").forEach(s => s.classList.remove("selected"))
            swatch.classList.add("selected")
            if (color === null) { eraseToolBtn.classList.add("active"); paintToolBtn.classList.remove("active") }
            else { paintToolBtn.classList.add("active"); eraseToolBtn.classList.remove("active") }
          }
          if (color === "#1f2937") swatch.classList.add("selected")
          editorPalette.appendChild(swatch)
        })
        editorSection.appendChild(editorPalette)
        contentDraw.appendChild(editorSection)
        charModal.appendChild(contentDraw)
        const charFooter = document.createElement("div")
        charFooter.className = "char-footer"
        const charNameInput = document.createElement("input")
        charNameInput.type = "text"; charNameInput.className = "char-name-input"; charNameInput.placeholder = "角色名称..."; charNameInput.value = state.characterName || ""
        charFooter.appendChild(charNameInput)
        if (state.characterSprite) {
          const removeCharBtn = document.createElement("button")
          removeCharBtn.className = "btn"; removeCharBtn.textContent = "🗑️ 移除"; removeCharBtn.style.fontSize = "12px"; removeCharBtn.style.padding = "6px 12px"
          removeCharBtn.onclick = removeCharacter
          charFooter.appendChild(removeCharBtn)
        }
        const saveCharBtn = document.createElement("button")
        saveCharBtn.className = "btn accent"; saveCharBtn.textContent = "💾 保存"
        saveCharBtn.onclick = saveCharacter
        charFooter.appendChild(saveCharBtn)
        const cancelCharBtn = document.createElement("button")
        cancelCharBtn.className = "btn"; cancelCharBtn.textContent = "取消"
        cancelCharBtn.onclick = closeCharPanel
        charFooter.appendChild(cancelCharBtn)
        charModal.appendChild(charFooter)
        charOverlay.appendChild(charModal)
        root.appendChild(charOverlay)
        container.appendChild(root)

        // ==================== 像素画布 ====================
        const pixels = []
        for (let y = 0; y < GRID_H; y++) {
          pixels[y] = []
          for (let x = 0; x < GRID_W; x++) {
            const pixel = document.createElement("div")
            pixel.className = "pixel"
            pixel.dataset.x = x; pixel.dataset.y = y
            pixel.onclick = () => handlePixelClick(x, y)
            canvas.appendChild(pixel)
            pixels[y][x] = pixel
          }
        }

        // ==================== 场景绘制 ====================
        function setPixel(x, y, color) {
          if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) {
            pixels[y][x].style.backgroundColor = color
          }
        }

        function drawRect(x, y, w, h, color) {
          for (let dy = 0; dy < h; dy++)
            for (let dx = 0; dx < w; dx++)
              setPixel(x + dx, y + dy, color)
        }

        function drawScene() {
          for (let y = 0; y < GRID_H; y++)
            for (let x = 0; x < GRID_W; x++) {
              pixels[y][x].style.backgroundColor = "transparent"
              pixels[y][x].className = "pixel"
            }

          const wp = WALL_PRESETS[state.wallPreset]
          const fp = FLOOR_PRESETS[state.floorPreset]

          // 天花板
          drawRect(0, 0, GRID_W, 1, PALETTE.ceiling)
          drawRect(0, 1, GRID_W, 1, PALETTE.ceiling_line)

          // 墙壁
          for (let y = 2; y < 15; y++) {
            for (let x = 0; x < GRID_W; x++) {
              setPixel(x, y, (x + y) % 3 === 0 ? wp.accent : wp.color)
            }
          }

          // 踢脚线
          drawRect(0, 15, GRID_W, 1, PALETTE.baseboard_top)
          drawRect(0, 16, GRID_W, 1, PALETTE.baseboard)

          // 地板
          for (let y = 17; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
              setPixel(x, y, (x + y) % 2 === 0 ? fp.color : fp.accent)
            }
          }

          // 窗户
          drawWindow(13, 3, 10, 8)

          // 公告板
          drawCorkBoard(2, 3, 9, 6)

          // 海报
          drawPoster(30, 2, 5, 7)

          // 门
          drawDoor(0, 8, 4, 8)

          // 书桌 + 电脑
          drawDesk(4, 17)

          // 书架
          drawBookshelf(28, 13)

          // 地毯
          drawRug(13, 21, 10, 4)

          // 落地灯
          drawFloorLamp(33, 12)

          // 垃圾桶
          drawTrashBin(1, 21)

          // 盆栽
          drawPlant(2, 15)

          // 角色
          drawCharacter()

          // 猫咪
          drawCat(state.catX, state.catY)
        }

        // ==================== 家具绘制 ====================
        function drawWindow(wx, wy, ww, wh) {
          // 窗框
          drawRect(wx - 1, wy - 1, ww + 2, 1, PALETTE.window_frame)
          drawRect(wx - 1, wy + wh, ww + 2, 1, PALETTE.window_frame)
          drawRect(wx - 1, wy, 1, wh, PALETTE.window_frame)
          drawRect(wx + ww, wy, 1, wh, PALETTE.window_frame)

          // 玻璃
          const glass = state.isNight ? PALETTE.window_glass_night : PALETTE.window_glass_day
          drawRect(wx, wy, ww, wh, glass)

          // 窗格
          drawRect(wx + Math.floor(ww / 2), wy, 1, wh, PALETTE.window_frame)
          drawRect(wx, wy + Math.floor(wh / 2), ww, 1, PALETTE.window_frame)

          // 夜间星星
          if (state.isNight) {
            state.stars.forEach((star, i) => {
              if (star.x >= wx && star.x < wx + ww && star.y >= wy && star.y < wy + wh) {
                setPixel(star.x, star.y, "#fef3c7")
                if (star.blink) {
                  pixels[star.y][star.x].classList.add("star-anim")
                  pixels[star.y][star.x].style.animationDelay = `${i * 0.3}s`
                }
              }
            })
          }

          // 窗台
          drawRect(wx - 1, wy + wh + 1, ww + 2, 1, PALETTE.window_frame)
        }

        function drawCorkBoard(cx, cy, cw, ch) {
          // 边框
          drawRect(cx - 1, cy - 1, cw + 2, ch + 2, PALETTE.cork_frame)
          // 软木板
          drawRect(cx, cy, cw, ch, PALETTE.cork)

          // 便利贴 - 粉色
          drawRect(cx + 1, cy + 1, 3, 2, "#f9a8d4")
          // 便利贴 - 黄色
          drawRect(cx + 5, cy + 1, 3, 2, "#fde047")
          // 照片
          drawRect(cx + 1, cy + 4, 4, 2, "#e5e7eb")
          setPixel(cx + 2, cy + 4, "#f8fafc")
          setPixel(cx + 3, cy + 4, "#f8fafc")
          setPixel(cx + 2, cy + 5, "#d1d5db")
          setPixel(cx + 3, cy + 5, "#d1d5db")
          // 图钉
          setPixel(cx + 2, cy, "#ef4444")
          setPixel(cx + 6, cy, "#3b82f6")
          setPixel(cx + 3, cy + 3, "#f59e0b")
        }

        function drawPoster(px, py, pw, ph) {
          drawRect(px - 1, py - 1, pw + 2, 1, PALETTE.poster_border)
          drawRect(px - 1, py + ph, pw + 2, 1, PALETTE.poster_border)
          drawRect(px - 1, py, 1, ph, PALETTE.poster_border)
          drawRect(px + pw, py, 1, ph, PALETTE.poster_border)
          drawRect(px, py, pw, ph, PALETTE.poster_bg)
          // 海报内容
          drawRect(px + 1, py + 1, pw - 2, 2, "#7c3aed")
          drawRect(px + 1, py + 3, pw - 2, 1, "#a78bfa")
          drawRect(px + 1, py + 4, pw - 2, 1, "#c4b5fd")
          setPixel(px + 2, py + 5, "#e5e7eb")
          setPixel(px + 3, py + 5, "#e5e7eb")
        }

        function drawDoor(dx, dy, dw, dh) {
          drawRect(dx, dy, dw, dh, PALETTE.door_panel)
          drawRect(dx + 1, dy + 1, 2, 3, PALETTE.door_frame)
          setPixel(dx + 2, dy + 5, PALETTE.door_knob)
          // 门框
          drawRect(dx, dy - 1, dw, 1, PALETTE.door_frame)
          drawRect(dx + dw, dy, 1, dh, PALETTE.door_frame)
        }

        function drawDesk(dx, dy) {
          // 桌腿
          drawRect(dx, dy + 3, 1, 4, PALETTE.desk_leg)
          drawRect(dx + 6, dy + 3, 1, 4, PALETTE.desk_leg)
          // 桌面
          drawRect(dx, dy + 2, 7, 1, PALETTE.desk_top)
          drawRect(dx, dy + 3, 7, 1, PALETTE.desk_top)
          // 抽屉
          drawRect(dx + 1, dy + 3, 3, 1, PALETTE.desk_drawer)
          setPixel(dx + 2, dy + 3, "#fbbf24")

          // 显示器底座
          drawRect(dx + 2, dy + 1, 4, 1, PALETTE.monitor_stand)
          drawRect(dx + 3, dy, 2, 1, PALETTE.monitor_stand)
          // 显示器
          drawRect(dx + 1, dy - 5, 5, 5, PALETTE.monitor_frame)
          drawRect(dx + 2, dy - 4, 3, 3, PALETTE.monitor_screen)
          // 屏幕光
          if (state.lightOn && !state.isNight) {
            setPixel(dx + 3, dy - 3, PALETTE.monitor_glow)
            setPixel(dx + 3, dy - 2, PALETTE.monitor_glow)
          }

          // 椅子
          drawRect(dx + 1, dy + 7, 5, 2, PALETTE.chair_seat)
          drawRect(dx + 1, dy + 9, 1, 1, PALETTE.chair_leg)
          drawRect(dx + 5, dy + 9, 1, 1, PALETTE.chair_leg)
          drawRect(dx + 2, dy + 6, 3, 1, PALETTE.chair_seat)
        }

        function drawBookshelf(sx, sy) {
          // 侧板
          drawRect(sx, sy, 1, 11, PALETTE.shelf_side)
          drawRect(sx + 3, sy, 1, 11, PALETTE.shelf_side)
          // 隔板
          drawRect(sx, sy, 4, 1, PALETTE.shelf_board)
          drawRect(sx, sy + 4, 4, 1, PALETTE.shelf_board)
          drawRect(sx, sy + 7, 4, 1, PALETTE.shelf_board)
          drawRect(sx, sy + 10, 4, 1, PALETTE.shelf_board)

          // 书
          const books = [
            [sx + 1, sy + 1], [sx + 2, sy + 1], [sx + 1, sy + 2], [sx + 2, sy + 2],
            [sx + 1, sy + 5], [sx + 2, sy + 5], [sx + 1, sy + 6], [sx + 2, sy + 6],
            [sx + 1, sy + 8], [sx + 2, sy + 8], [sx + 1, sy + 9], [sx + 2, sy + 9]
          ]
          const colors = [PALETTE.book_red, PALETTE.book_blue, PALETTE.book_green, PALETTE.book_purple,
            PALETTE.book_yellow, PALETTE.book_orange, PALETTE.book_pink, PALETTE.book_white,
            PALETTE.book_red, PALETTE.book_blue, PALETTE.book_green, PALETTE.book_purple]
          books.forEach(([bx, by], i) => setPixel(bx, by, colors[i % colors.length]))

          // 顶层装饰
          setPixel(sx + 1, sy, "#fde047")
          setPixel(sx + 2, sy, "#fde047")
        }

        function drawRug(rx, ry, rw, rh) {
          drawRect(rx, ry, rw, rh, PALETTE.rug_main)
          drawRect(rx, ry, rw, 1, PALETTE.rug_border)
          drawRect(rx, ry + rh - 1, rw, 1, PALETTE.rug_border)
          drawRect(rx, ry, 1, rh, PALETTE.rug_border)
          drawRect(rx + rw - 1, ry, 1, rh, PALETTE.rug_border)
          // 地毯花纹
          drawRect(rx + 3, ry + 1, rw - 6, 1, PALETTE.rug_pattern)
          drawRect(rx + 3, ry + rh - 2, rw - 6, 1, PALETTE.rug_pattern)
        }

        function drawFloorLamp(lx, ly) {
          // 灯座
          drawRect(lx + 1, ly + 9, 2, 1, PALETTE.lamp_stand)
          drawRect(lx + 1, ly + 8, 2, 1, PALETTE.lamp_stand)
          // 灯杆
          drawRect(lx + 1, ly + 2, 2, 6, PALETTE.lamp_stand)
          // 灯罩
          drawRect(lx, ly, 4, 2, PALETTE.lamp_shade)
          drawRect(lx + 1, ly - 1, 2, 1, PALETTE.lamp_shade)
          // 灯光
          if (state.lightOn) {
            setPixel(lx + 1, ly + 2, PALETTE.lamp_glow)
            setPixel(lx + 2, ly + 2, PALETTE.lamp_glow)
          }
        }

        function drawTrashBin(tx, ty) {
          drawRect(tx, ty, 3, 3, PALETTE.bin_color)
          drawRect(tx, ty - 1, 3, 1, PALETTE.bin_lid)
          setPixel(tx + 1, ty - 1, "#6b7280")
        }

        function drawPlant(px, py) {
          // 花盆
          drawRect(px, py, 3, 2, PALETTE.pot)
          drawRect(px + 1, py - 1, 1, 1, PALETTE.pot_soil)
          // 植物
          setPixel(px + 1, py - 2, PALETTE.plant_green)
          setPixel(px + 1, py - 3, PALETTE.plant_light)
          setPixel(px, py - 3, PALETTE.plant_green)
          setPixel(px + 2, py - 3, PALETTE.plant_green)
          setPixel(px + 1, py - 4, PALETTE.plant_light)
          setPixel(px, py - 2, PALETTE.plant_green)
        }

        function drawCat(x, y) {
          if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return
          const cc = { orange: PALETTE.cat_orange, white: PALETTE.cat_white, black: PALETTE.cat_black }
          const c = cc[state.catColor] || PALETTE.cat_orange
          if (y - 1 >= 0) setPixel(x, y - 1, c)
          setPixel(x, y, c)
          if (x + 1 < GRID_W) { if (y - 1 >= 0) setPixel(x + 1, y - 1, c); setPixel(x + 1, y, c) }
          if (y - 2 >= 0) { setPixel(x, y - 2, c); if (x + 1 < GRID_W) setPixel(x + 1, y - 2, c) }
          if (y - 3 >= 0) { setPixel(x, y - 3, c); if (x + 1 < GRID_W) setPixel(x + 1, y - 3, c) }
          if (x - 1 >= 0 && y - 1 >= 0) setPixel(x - 1, y - 1, c)
          if (y - 2 >= 0) {
            setPixel(x, y - 2, "#1f2937")
            if (x + 1 < GRID_W) setPixel(x + 1, y - 2, "#1f2937")
            if (state.catDir > 0) setPixel(x + 1, y - 2, "#f8fafc")
            else setPixel(x, y - 2, "#f8fafc")
          }
          if (pixels[y][x]) pixels[y][x].classList.add("cat-anim")
        }

        function drawCharacter() {
          if (!state.characterSprite) return
          const sw = state.characterSprite.width
          const sh = state.characterSprite.height
          const sp = state.characterSprite.pixels
          const topY = CHAR_BASE_Y - sh + 1 + charBob
          for (let py = 0; py < sh; py++)
            for (let px = 0; px < sw; px++) {
              const color = sp[py] && sp[py][px]
              if (color) setPixel(CHAR_BASE_X + px, topY + py, color)
            }
        }

        // ==================== 图片转像素 ====================
        function rgbToHex(r, g, b) {
          return "#" + [r, g, b].map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("")
        }

        function imageToPixelSprite(imgUrl, spriteW, spriteH) {
          return new Promise((resolve, reject) => {
            const loadAndConvert = (src, crossOrigin) => {
              const img = new Image()
              if (crossOrigin) img.crossOrigin = "anonymous"
              img.onload = () => {
                try {
                  const cv = document.createElement("canvas")
                  cv.width = spriteW; cv.height = spriteH
                  const ctx = cv.getContext("2d")
                  ctx.imageSmoothingEnabled = false
                  const ratio = img.width / img.height
                  const sRatio = spriteW / spriteH
                  let sx, sy, sw, sh
                  if (ratio > sRatio) { sh = img.height; sw = sh * sRatio; sx = (img.width - sw) / 2; sy = 0 }
                  else { sw = img.width; sh = sw / sRatio; sx = 0; sy = (img.height - sh) / 2 }
                  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, spriteW, spriteH)
                  const data = ctx.getImageData(0, 0, spriteW, spriteH).data
                  const result = []
                  for (let y = 0; y < spriteH; y++) {
                    const row = []
                    for (let x = 0; x < spriteW; x++) {
                      const i = (y * spriteW + x) * 4
                      row.push(data[i + 3] < 128 ? null : rgbToHex(data[i], data[i + 1], data[i + 2]))
                    }
                    result.push(row)
                  }
                  resolve({ width: spriteW, height: spriteH, pixels: result })
                } catch (e) { reject(new Error("处理失败")) }
              }
              img.onerror = () => { if (crossOrigin) loadAndConvert(src, false); else reject(new Error("图片加载失败")) }
              img.src = src
            }
            loadAndConvert(imgUrl, true)
          })
        }

        function createBlankSprite(w, h) {
          const px = []
          for (let y = 0; y < h; y++) { const row = []; for (let x = 0; x < w; x++) row.push(null); px.push(row) }
          return { width: w, height: h, pixels: px }
        }

        // ==================== 角色弹窗 ====================
        function openCharPanel() {
          charNameInput.value = state.characterName || ""
          if (state.characterSprite) workingSprite = JSON.parse(JSON.stringify(state.characterSprite))
          else workingSprite = createBlankSprite(DEFAULT_SPRITE_W, DEFAULT_SPRITE_H)
          editorWInput.value = String(workingSprite.width); editorHInput.value = String(workingSprite.height)
          buildEditorGrid(); charOverlay.classList.add("active"); loadCharList()
        }
        function closeCharPanel() { charOverlay.classList.remove("active") }
        function switchTab(tabName) {
          document.querySelectorAll(".roche-plugin-pixel-house .char-tab").forEach(t => t.classList.remove("active"))
          document.querySelectorAll(".roche-plugin-pixel-house .char-tab-content").forEach(c => c.classList.remove("active"))
          if (tabName === "chars") { tabChars.classList.add("active"); contentChars.classList.add("active"); loadCharList() }
          else if (tabName === "upload") { tabUpload.classList.add("active"); contentUpload.classList.add("active") }
          else if (tabName === "draw") {
            tabDraw.classList.add("active"); contentDraw.classList.add("active")
            if (!workingSprite) workingSprite = createBlankSprite(DEFAULT_SPRITE_W, DEFAULT_SPRITE_H)
            buildEditorGrid()
          }
        }

        async function loadCharList() {
          contentChars.innerHTML = '<div class="char-loading">加载角色列表中...</div>'
          try {
            const chars = await roche.character.list()
            if (!chars || chars.length === 0) { contentChars.innerHTML = '<div class="char-empty">暂无角色</div>'; return }
            contentChars.innerHTML = ""
            const listEl = document.createElement("div"); listEl.className = "char-list"
            chars.forEach(char => {
              const item = document.createElement("div"); item.className = "char-item"
              const dn = char.handle || char.name || "未命名"
              const placeholder = document.createElement("div"); placeholder.className = "char-item-placeholder"; placeholder.textContent = dn.charAt(0) || "?"
              if (char.avatar) {
                const avatar = document.createElement("img"); avatar.className = "char-item-avatar"; avatar.src = char.avatar
                avatar.onerror = () => { avatar.style.display = "none"; placeholder.style.display = "flex" }
                item.appendChild(avatar); placeholder.style.display = "none"; item.appendChild(placeholder)
              } else item.appendChild(placeholder)
              const info = document.createElement("div")
              const nameEl = document.createElement("div"); nameEl.className = "char-item-name"; nameEl.textContent = dn; info.appendChild(nameEl)
              if (char.name && char.name !== dn) { const h = document.createElement("div"); h.className = "char-item-handle"; h.textContent = char.name; info.appendChild(h) }
              item.appendChild(info); item.onclick = () => selectCharacter(char); listEl.appendChild(item)
            })
            contentChars.appendChild(listEl)
          } catch (e) { contentChars.innerHTML = '<div class="char-error">' + (e.message || "错误") + '</div>' }
        }

        async function selectCharacter(char) {
          const dn = char.handle || char.name || "自定义角色"; charNameInput.value = dn
          if (!char.avatar) { roche.ui.toast("该角色没有头像"); return }
          contentChars.innerHTML = '<div class="char-loading">正在转换...</div>'
          try {
            const sprite = await imageToPixelSprite(char.avatar, DEFAULT_SPRITE_W, DEFAULT_SPRITE_H)
            workingSprite = sprite; editorWInput.value = String(sprite.width); editorHInput.value = String(sprite.height)
            switchTab("draw"); roche.ui.toast("已导入「" + dn + "」")
          } catch (e) { contentChars.innerHTML = '<div class="char-error">' + (e.message || "失败") + '</div>' }
        }

        function handleFileUpload(e) {
          const file = e.target.files[0]; if (!file) return
          const reader = new FileReader()
          reader.onload = async (ev) => {
            uploadPreview.innerHTML = '<div class="char-loading">正在像素化...</div>'
            const w = parseInt(widthSlider.value) || DEFAULT_SPRITE_W
            const h = parseInt(heightSlider.value) || DEFAULT_SPRITE_H
            try {
              const sprite = await imageToPixelSprite(ev.target.result, w, h)
              workingSprite = sprite; editorWInput.value = String(sprite.width); editorHInput.value = String(sprite.height)
              charNameInput.value = charNameInput.value || "自定义角色"
              uploadPreview.innerHTML = '<div style="color:#22c55e;font-weight:bold;">✓ 像素化完成</div>'; switchTab("draw")
              roche.ui.toast("已导入编辑器")
            } catch (err) { uploadPreview.innerHTML = '<div style="color:#ef4444;">' + (err.message || "失败") + '</div>' }
          }
          reader.readAsDataURL(file); e.target.value = ""
        }

        function buildEditorGrid() {
          if (!workingSprite) return; editorGrid.innerHTML = ""
          editorGrid.style.gridTemplateColumns = `repeat(${workingSprite.width}, 22px)`
          editorGrid.style.gridTemplateRows = `repeat(${workingSprite.height}, 22px)`
          for (let y = 0; y < workingSprite.height; y++)
            for (let x = 0; x < workingSprite.width; x++) {
              const cell = document.createElement("div"); cell.className = "editor-cell"; cell.dataset.x = x; cell.dataset.y = y
              updateEditorCell(cell, workingSprite.pixels[y][x]); cell.onclick = () => handleEditorClick(x, y); editorGrid.appendChild(cell)
            }
        }
        function updateEditorCell(cell, color) {
          if (color) { cell.style.backgroundColor = color; cell.classList.remove("transparent") }
          else { cell.style.backgroundColor = ""; cell.classList.add("transparent") }
        }
        function handleEditorClick(x, y) {
          if (!workingSprite) return
          workingSprite.pixels[y][x] = editorMode === "erase" ? null : selectedColor
          const cell = editorGrid.children[y * workingSprite.width + x]; if (cell) updateEditorCell(cell, workingSprite.pixels[y][x])
        }
        async function saveCharacter() {
          if (!workingSprite) { roche.ui.toast("请先创建形象"); return }
          let has = false
          for (let y = 0; y < workingSprite.height; y++) { for (let x = 0; x < workingSprite.width; x++) { if (workingSprite.pixels[y][x]) { has = true; break } } if (has) break }
          if (!has) { roche.ui.toast("形象是空白的"); return }
          state.characterSprite = workingSprite; state.characterName = charNameInput.value.trim() || "自定义角色"
          await saveState(); charBtn.textContent = "👤 编辑角色"; closeCharPanel(); drawScene(); roche.ui.toast("已保存！")
        }
        async function removeCharacter() {
          state.characterSprite = null; state.characterName = ""
          await saveState(); charBtn.textContent = "👤 添加角色"; closeCharPanel(); drawScene(); roche.ui.toast("已移除")
        }

        // ==================== 交互 ====================
        function handlePixelClick(x, y) {
          // 窗户区域
          if (x >= 12 && x <= 23 && y >= 2 && y <= 11) { toggleDayNight(); return }
          // 角色
          if (state.characterSprite) {
            const sw = state.characterSprite.width; const sh = state.characterSprite.height
            const topY = CHAR_BASE_Y - sh + 1 + charBob
            if (x >= CHAR_BASE_X && x < CHAR_BASE_X + sw && y >= topY && y <= CHAR_BASE_Y) {
              charJumping = true; jumpFrame = 0
              if (state.characterName) roche.ui.toast("👋 " + state.characterName)
              return
            }
          }
          // 灯
          if (x >= 33 && x <= 35 && y >= 10 && y <= 22) { toggleLight(); return }
          // 猫咪
          if (Math.abs(x - state.catX) <= 2 && Math.abs(y - state.catY) <= 3) { state.catDir *= -1; saveState(); drawScene(); return }
          // 书桌
          if (x >= 4 && x <= 10 && y >= 12 && y <= 24) { cycleWallpaper(); return }
          // 书柜
          if (x >= 28 && x <= 31 && y >= 13 && y <= 24) { cycleFloor(); return }
        }

        async function toggleDayNight() {
          state.isNight = !state.isNight; await saveState(); drawScene()
        }
        async function toggleLight() {
          state.lightOn = !state.lightOn; lightBtn.textContent = state.lightOn ? "💡 关灯" : "💡 开灯"
          await saveState(); drawScene()
        }
        async function cycleWallpaper() {
          state.wallPreset = (state.wallPreset + 1) % WALL_PRESETS.length
          await saveState(); drawScene()
          roche.ui.toast("墙纸：" + WALL_PRESETS[state.wallPreset].name)
        }
        async function cycleFloor() {
          state.floorPreset = (state.floorPreset + 1) % FLOOR_PRESETS.length
          await saveState(); drawScene()
          roche.ui.toast("地板：" + FLOOR_PRESETS[state.floorPreset].name)
        }
        async function changeCat() {
          const cc = ["orange", "white", "black"]
          state.catColor = cc[(cc.indexOf(state.catColor) + 1) % cc.length]
          await saveState(); drawScene()
        }
        async function saveState() {
          try {
            await roche.storage.set("pixelHouseState", {
              wallPreset: state.wallPreset, floorPreset: state.floorPreset,
              isNight: state.isNight, lightOn: state.lightOn,
              catColor: state.catColor,
              characterSprite: state.characterSprite, characterName: state.characterName
            })
          } catch (e) {}
        }

        // ==================== 动画 ====================
        let animInterval = setInterval(() => {
          if (Math.random() > 0.3) {} else {
            const nx = state.catX + state.catDir
            if (nx >= 1 && nx < GRID_W - 2) state.catX = nx
            else state.catDir *= -1
            if (Math.random() > 0.95) state.catDir *= -1
          }
          if (charJumping) {
            jumpFrame++
            if (jumpFrame < 6) charBob = -jumpFrame
            else if (jumpFrame < 12) charBob = -(12 - jumpFrame)
            else { charJumping = false; jumpFrame = 0; charBob = 0 }
          } else charBob = Math.sin(Date.now() / 600) > 0 ? 0 : -1
          drawScene()
        }, 400)

        drawScene()

        this._cleanup = () => {
          clearInterval(animInterval)
          if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl)
        }
      },
      async unmount(container, roche) {
        if (this._cleanup) this._cleanup()
        container.replaceChildren()
      }
    }
  ]
})