window.RochePlugin.register({
  id: "pixel-house",
  name: "像素小屋",
  version: "1.1.0",
  apps: [
    {
      id: "pixel-house-home",
      name: "像素小屋",
      icon: "home",
      iconImage: "",
      async mount(container, roche) {
        // ==================== 配置 ====================
        const GRID_W = 36
        const GRID_H = 26
        const PIXEL_SIZE = 16
        const CHAR_BASE_X = 4
        const CHAR_BASE_Y = 25
        const DEFAULT_SPRITE_W = 8
        const DEFAULT_SPRITE_H = 12

        const PALETTE = {
          sky_day: "#87CEEB",
          sky_night: "#0f172a",
          grass: "#4ade80",
          grass_dark: "#22c55e",
          house_wall: "#fde68a",
          house_wall_dark: "#fcd34d",
          roof: "#b45309",
          roof_dark: "#92400e",
          door: "#78350f",
          door_open: "#451a03",
          window: "#bae6fd",
          window_lit: "#fde047",
          window_dark: "#1e3a5f",
          chimney: "#a16207",
          trunk: "#78350f",
          leaves: "#15803d",
          leaves_dark: "#166534",
          sun: "#facc15",
          moon: "#fef3c7",
          cloud: "#f8fafc",
          cloud_night: "#334155",
          smoke: "#e2e8f0",
          flower_red: "#ef4444",
          flower_pink: "#f472b6",
          flower_purple: "#a855f7",
          flower_white: "#f8fafc",
          flower_center: "#fbbf24",
          path: "#d6d3d1",
          fence: "#a8a29e",
          water: "#38bdf8",
          cat_orange: "#fb923c",
          cat_white: "#f8fafc",
          cat_black: "#1f2937",
          star: "#fef3c7"
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
          isNight: false,
          doorOpen: false,
          windowLit: false,
          flowers: {},
          catX: 5,
          catY: 20,
          catDir: 1,
          catFrame: 0,
          catColor: "orange",
          stars: [],
          characterSprite: null,
          characterName: ""
        }

        try {
          const saved = await roche.storage.get("pixelHouseState")
          if (saved) state = { ...state, ...saved }
        } catch (e) {}

        for (let i = 0; i < 20; i++) {
          state.stars.push({
            x: Math.floor(Math.random() * GRID_W),
            y: Math.floor(Math.random() * 10),
            blink: Math.random() > 0.5
          })
        }

        // 角色动画状态
        let charBob = 0
        let charJumping = false
        let jumpFrame = 0

        // 编辑器状态
        let workingSprite = null
        let selectedColor = "#1f2937"
        let editorMode = "paint"

        // ==================== 样式 ====================
        const styleEl = document.createElement("style")
        styleEl.textContent = `
          .roche-plugin-pixel-house {
            width: 100%; height: 100%;
            background: ${PALETTE.sky_day};
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            overflow: auto;
            font-family: "Courier New", monospace;
            transition: background 0.5s ease;
            position: relative;
          }
          .roche-plugin-pixel-house.night { background: ${PALETTE.sky_night}; }
          .roche-plugin-pixel-house .pixel-canvas {
            display: grid;
            grid-template-columns: repeat(${GRID_W}, ${PIXEL_SIZE}px);
            grid-template-rows: repeat(${GRID_H}, ${PIXEL_SIZE}px);
            gap: 0; border: 4px solid #374151;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            background: ${PALETTE.sky_day};
            transition: background 0.5s ease;
            cursor: pointer; user-select: none;
          }
          .roche-plugin-pixel-house.night .pixel-canvas { background: ${PALETTE.sky_night}; }
          .roche-plugin-pixel-house .pixel {
            width: ${PIXEL_SIZE}px; height: ${PIXEL_SIZE}px;
            transition: background-color 0.3s ease;
          }
          .roche-plugin-pixel-house .pixel:hover { filter: brightness(1.15); }
          .roche-plugin-pixel-house .controls {
            margin-top: 16px; display: flex; gap: 12px;
            align-items: center; flex-wrap: wrap; justify-content: center;
          }
          .roche-plugin-pixel-house .btn {
            padding: 8px 16px; border: 3px solid #374151;
            background: #f3f4f6; color: #1f2937;
            font-family: inherit; font-size: 14px; font-weight: bold;
            cursor: pointer; box-shadow: 4px 4px 0 #374151;
            transition: all 0.1s ease;
          }
          .roche-plugin-pixel-house .btn:hover {
            transform: translate(-1px, -1px); box-shadow: 5px 5px 0 #374151;
          }
          .roche-plugin-pixel-house .btn:active {
            transform: translate(3px, 3px); box-shadow: 1px 1px 0 #374151;
          }
          .roche-plugin-pixel-house .hint {
            margin-top: 12px; color: #6b7280; font-size: 12px;
            text-align: center; line-height: 1.5;
          }
          .roche-plugin-pixel-house.night .hint { color: #94a3b8; }
          .roche-plugin-pixel-house .title {
            font-size: 24px; font-weight: bold; color: #1f2937;
            margin-bottom: 12px; text-shadow: 2px 2px 0 #fff;
          }
          .roche-plugin-pixel-house.night .title {
            color: #f8fafc; text-shadow: 2px 2px 0 #1e293b;
          }
          @keyframes smoke-rise {
            0% { opacity: 0.8; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
          }
          .roche-plugin-pixel-house .smoke-anim { animation: smoke-rise 2s ease-out infinite; }
          @keyframes twinkle { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
          .roche-plugin-pixel-house .star-anim { animation: twinkle 2s ease-in-out infinite; }
          @keyframes cat-walk { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
          .roche-plugin-pixel-house .cat-anim { animation: cat-walk 0.3s ease-in-out infinite; }
          .roche-plugin-pixel-house .close-btn {
            position: absolute; top: 12px; right: 12px;
            width: 36px; height: 36px;
            display: flex; align-items: center; justify-content: center;
            border: 3px solid #374151; background: #f3f4f6;
            cursor: pointer; font-size: 18px; font-weight: bold;
            box-shadow: 3px 3px 0 #374151; z-index: 10;
          }
          .roche-plugin-pixel-house .close-btn:hover { background: #fee2e2; }

          /* ===== 角色弹窗 ===== */
          .roche-plugin-pixel-house .char-overlay {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6); display: none;
            align-items: center; justify-content: center;
            z-index: 100; padding: 16px;
          }
          .roche-plugin-pixel-house .char-overlay.active { display: flex; }
          .roche-plugin-pixel-house .char-modal {
            background: #f9fafb; border: 4px solid #374151;
            box-shadow: 8px 8px 0 #374151;
            max-width: 560px; width: 100%; max-height: 85vh;
            overflow-y: auto; padding: 20px;
          }
          .roche-plugin-pixel-house .char-modal-header {
            display: flex; justify-content: space-between;
            align-items: center; margin-bottom: 16px;
          }
          .roche-plugin-pixel-house .char-modal-title {
            font-size: 18px; font-weight: bold; color: #1f2937;
          }
          .roche-plugin-pixel-house .char-modal-close {
            width: 32px; height: 32px;
            border: 2px solid #374151; background: #f3f4f6;
            cursor: pointer; font-size: 16px; font-weight: bold;
          }
          .roche-plugin-pixel-house .char-tabs {
            display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
          }
          .roche-plugin-pixel-house .char-tab {
            padding: 6px 14px; border: 2px solid #374151;
            background: #f3f4f6; cursor: pointer;
            font-family: inherit; font-size: 13px; font-weight: bold;
          }
          .roche-plugin-pixel-house .char-tab.active {
            background: #374151; color: #f9fafb;
          }
          .roche-plugin-pixel-house .char-tab-content { display: none; }
          .roche-plugin-pixel-house .char-tab-content.active { display: block; }
          .roche-plugin-pixel-house .char-list {
            display: flex; flex-direction: column; gap: 8px;
            max-height: 320px; overflow-y: auto;
          }
          .roche-plugin-pixel-house .char-item {
            display: flex; align-items: center; gap: 12px;
            padding: 8px; border: 2px solid #d1d5db;
            background: #fff; cursor: pointer;
          }
          .roche-plugin-pixel-house .char-item:hover {
            border-color: #374151; background: #f9fafb;
          }
          .roche-plugin-pixel-house .char-item-avatar {
            width: 40px; height: 40px; border: 2px solid #d1d5db;
            object-fit: cover; background: #f3f4f6;
          }
          .roche-plugin-pixel-house .char-item-placeholder {
            width: 40px; height: 40px; border: 2px solid #d1d5db;
            background: #f3f4f6; display: flex; align-items: center;
            justify-content: center; font-size: 18px; font-weight: bold; color: #6b7280;
          }
          .roche-plugin-pixel-house .char-item-name {
            font-size: 14px; font-weight: bold; color: #1f2937;
          }
          .roche-plugin-pixel-house .char-item-handle {
            font-size: 12px; color: #6b7280;
          }
          .roche-plugin-pixel-house .upload-area {
            display: flex; flex-direction: column; gap: 12px;
          }
          .roche-plugin-pixel-house .upload-btn-wrapper {
            position: relative; overflow: hidden; display: inline-block;
          }
          .roche-plugin-pixel-house .upload-btn {
            padding: 8px 16px; border: 3px solid #374151;
            background: #f3f4f6; cursor: pointer;
            font-family: inherit; font-size: 14px; font-weight: bold;
            box-shadow: 4px 4px 0 #374151; display: inline-block;
          }
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
          .roche-plugin-pixel-house .size-control label {
            font-size: 12px; color: #6b7280;
          }
          .roche-plugin-pixel-house .size-control input[type=range] { width: 120px; }
          .roche-plugin-pixel-house .size-value { font-size: 14px; font-weight: bold; }
          .roche-plugin-pixel-house .upload-preview {
            margin-top: 8px; padding: 12px; border: 2px dashed #d1d5db;
            background: #fff; text-align: center; min-height: 60px;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; color: #6b7280;
          }
          .roche-plugin-pixel-house .editor-section {
            display: flex; flex-direction: column; gap: 12px;
          }
          .roche-plugin-pixel-house .editor-controls {
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
          }
          .roche-plugin-pixel-house .editor-size-input {
            width: 50px; padding: 4px; border: 2px solid #374151;
            font-family: inherit; font-size: 13px;
          }
          .roche-plugin-pixel-house .editor-grid-wrapper {
            overflow: auto; max-width: 100%; padding: 8px;
            background: #e5e7eb; border: 2px solid #374151;
          }
          .roche-plugin-pixel-house .editor-grid { display: grid; gap: 0; }
          .roche-plugin-pixel-house .editor-cell {
            width: 22px; height: 22px; cursor: pointer;
            box-sizing: border-box; border: 1px solid #e5e7eb;
          }
          .roche-plugin-pixel-house .editor-cell.transparent {
            background-image:
              linear-gradient(45deg, #d1d5db 25%, transparent 25%, transparent 75%, #d1d5db 75%),
              linear-gradient(45deg, #d1d5db 25%, transparent 25%, transparent 75%, #d1d5db 75%);
            background-size: 8px 8px;
            background-position: 0 0, 4px 4px;
            background-color: #fff;
          }
          .roche-plugin-pixel-house .editor-palette {
            display: flex; flex-wrap: wrap; gap: 4px;
            padding: 8px; background: #e5e7eb; border: 2px solid #374151;
          }
          .roche-plugin-pixel-house .palette-swatch {
            width: 24px; height: 24px; cursor: pointer;
            border: 2px solid #374151; box-sizing: border-box;
          }
          .roche-plugin-pixel-house .palette-swatch.selected {
            border: 3px solid #f59e0b; box-shadow: 0 0 0 2px #374151;
          }
          .roche-plugin-pixel-house .palette-swatch.eraser {
            background-image:
              linear-gradient(45deg, #d1d5db 25%, transparent 25%, transparent 75%, #d1d5db 75%),
              linear-gradient(45deg, #d1d5db 25%, transparent 25%, transparent 75%, #d1d5db 75%);
            background-size: 8px 8px; background-position: 0 0, 4px 4px;
            background-color: #fff;
          }
          .roche-plugin-pixel-house .editor-tools { display: flex; gap: 8px; }
          .roche-plugin-pixel-house .tool-btn {
            padding: 4px 12px; border: 2px solid #374151;
            background: #f3f4f6; cursor: pointer;
            font-family: inherit; font-size: 12px; font-weight: bold;
          }
          .roche-plugin-pixel-house .tool-btn.active { background: #374151; color: #f9fafb; }
          .roche-plugin-pixel-house .char-footer {
            margin-top: 16px; display: flex; gap: 8px;
            align-items: center; flex-wrap: wrap;
          }
          .roche-plugin-pixel-house .char-name-input {
            flex: 1; min-width: 120px; padding: 6px 10px;
            border: 2px solid #374151; font-family: inherit; font-size: 14px;
          }
          .roche-plugin-pixel-house .char-loading {
            text-align: center; padding: 20px; color: #6b7280; font-size: 14px;
          }
          .roche-plugin-pixel-house .char-error {
            text-align: center; padding: 20px; color: #dc2626; font-size: 14px;
          }
          .roche-plugin-pixel-house .char-empty {
            text-align: center; padding: 20px; color: #6b7280; font-size: 14px;
          }
        `
        document.head.appendChild(styleEl)

        // ==================== DOM 结构 ====================
        const root = document.createElement("div")
        root.className = `roche-plugin-pixel-house ${state.isNight ? "night" : ""}`

        const closeBtn = document.createElement("button")
        closeBtn.className = "close-btn"
        closeBtn.textContent = "×"
        closeBtn.onclick = () => roche.ui.closeApp()
        root.appendChild(closeBtn)

        const title = document.createElement("div")
        title.className = "title"
        title.textContent = "🏠 像素小屋"
        root.appendChild(title)

        const canvas = document.createElement("div")
        canvas.className = "pixel-canvas"
        root.appendChild(canvas)

        const controls = document.createElement("div")
        controls.className = "controls"

        const dayNightBtn = document.createElement("button")
        dayNightBtn.className = "btn"
        dayNightBtn.textContent = state.isNight ? "☀️ 切换白天" : "🌙 切换黑夜"
        dayNightBtn.onclick = toggleDayNight
        controls.appendChild(dayNightBtn)

        const doorBtn = document.createElement("button")
        doorBtn.className = "btn"
        doorBtn.textContent = state.doorOpen ? "🚪 关门" : "🚪 开门"
        doorBtn.onclick = toggleDoor
        controls.appendChild(doorBtn)

        const lightBtn = document.createElement("button")
        lightBtn.className = "btn"
        lightBtn.textContent = state.windowLit ? "💡 关灯" : "💡 开灯"
        lightBtn.onclick = toggleLight
        controls.appendChild(lightBtn)

        const flowerBtn = document.createElement("button")
        flowerBtn.className = "btn"
        flowerBtn.textContent = "🌸 重置花园"
        flowerBtn.onclick = resetFlowers
        controls.appendChild(flowerBtn)

        const catBtn = document.createElement("button")
        catBtn.className = "btn"
        catBtn.textContent = "🐱 换只猫咪"
        catBtn.onclick = changeCat
        controls.appendChild(catBtn)

        const charBtn = document.createElement("button")
        charBtn.className = "btn"
        charBtn.textContent = state.characterSprite ? "👤 编辑角色" : "👤 添加角色"
        charBtn.onclick = openCharPanel
        controls.appendChild(charBtn)

        root.appendChild(controls)

        const hint = document.createElement("div")
        hint.className = "hint"
        hint.innerHTML = "点击天空切换昼夜 · 点击门开关门 · 点击窗户开关灯<br>点击草地种花 · 点击小猫换方向 · 点击角色打招呼"
        root.appendChild(hint)

        // ==================== 角色弹窗 ====================
        const charOverlay = document.createElement("div")
        charOverlay.className = "char-overlay"

        const charModal = document.createElement("div")
        charModal.className = "char-modal"

        // 弹窗头部
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

        // Tab 栏
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

        // Tab 内容：角色列表
        const contentChars = document.createElement("div")
        contentChars.className = "char-tab-content active"
        contentChars.innerHTML = '<div class="char-loading">加载中...</div>'
        charModal.appendChild(contentChars)

        // Tab 内容：上传图片
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
        widthSlider.type = "range"
        widthSlider.min = "4"
        widthSlider.max = "16"
        widthSlider.value = String(DEFAULT_SPRITE_W)
        const widthValue = document.createElement("div")
        widthValue.className = "size-value"
        widthValue.textContent = String(DEFAULT_SPRITE_W)
        widthSlider.oninput = () => widthValue.textContent = widthSlider.value
        widthControl.appendChild(widthSlider)
        widthControl.appendChild(widthValue)
        sizeControls.appendChild(widthControl)

        const heightControl = document.createElement("div")
        heightControl.className = "size-control"
        heightControl.innerHTML = "<label>像素高度</label>"
        const heightSlider = document.createElement("input")
        heightSlider.type = "range"
        heightSlider.min = "6"
        heightSlider.max = "20"
        heightSlider.value = String(DEFAULT_SPRITE_H)
        const heightValue = document.createElement("div")
        heightValue.className = "size-value"
        heightValue.textContent = String(DEFAULT_SPRITE_H)
        heightSlider.oninput = () => heightValue.textContent = heightSlider.value
        heightControl.appendChild(heightSlider)
        heightControl.appendChild(heightValue)
        sizeControls.appendChild(heightControl)

        uploadArea.appendChild(sizeControls)

        const uploadPreview = document.createElement("div")
        uploadPreview.className = "upload-preview"
        uploadPreview.textContent = "选择图片后会自动像素化，可在「手绘编辑」中微调"
        uploadArea.appendChild(uploadPreview)

        contentUpload.appendChild(uploadArea)
        charModal.appendChild(contentUpload)

        // Tab 内容：手绘编辑
        const contentDraw = document.createElement("div")
        contentDraw.className = "char-tab-content"

        const editorSection = document.createElement("div")
        editorSection.className = "editor-section"

        // 编辑器控制栏
        const editorControlsEl = document.createElement("div")
        editorControlsEl.className = "editor-controls"
        editorControlsEl.innerHTML = "尺寸: "

        const editorWInput = document.createElement("input")
        editorWInput.type = "number"
        editorWInput.className = "editor-size-input"
        editorWInput.value = String(DEFAULT_SPRITE_W)
        editorWInput.min = "4"
        editorWInput.max = "16"
        editorControlsEl.appendChild(editorWInput)

        const xLabel = document.createElement("span")
        xLabel.textContent = " × "
        editorControlsEl.appendChild(xLabel)

        const editorHInput = document.createElement("input")
        editorHInput.type = "number"
        editorHInput.className = "editor-size-input"
        editorHInput.value = String(DEFAULT_SPRITE_H)
        editorHInput.min = "6"
        editorHInput.max = "20"
        editorControlsEl.appendChild(editorHInput)

        const newSpriteBtn = document.createElement("button")
        newSpriteBtn.className = "btn"
        newSpriteBtn.textContent = "新建"
        newSpriteBtn.style.fontSize = "12px"
        newSpriteBtn.style.padding = "4px 10px"
        newSpriteBtn.onclick = () => {
          const w = Math.max(4, Math.min(16, parseInt(editorWInput.value) || DEFAULT_SPRITE_W))
          const h = Math.max(6, Math.min(20, parseInt(editorHInput.value) || DEFAULT_SPRITE_H))
          workingSprite = createBlankSprite(w, h)
          buildEditorGrid()
        }
        editorControlsEl.appendChild(newSpriteBtn)

        const clearBtn2 = document.createElement("button")
        clearBtn2.className = "btn"
        clearBtn2.textContent = "清空"
        clearBtn2.style.fontSize = "12px"
        clearBtn2.style.padding = "4px 10px"
        clearBtn2.onclick = () => {
          if (!workingSprite) return
          for (let y = 0; y < workingSprite.height; y++) {
            for (let x = 0; x < workingSprite.width; x++) {
              workingSprite.pixels[y][x] = null
            }
          }
          buildEditorGrid()
        }
        editorControlsEl.appendChild(clearBtn2)

        editorSection.appendChild(editorControlsEl)

        // 工具栏
        const editorTools = document.createElement("div")
        editorTools.className = "editor-tools"

        const paintToolBtn = document.createElement("button")
        paintToolBtn.className = "tool-btn active"
        paintToolBtn.textContent = "✏️ 画笔"
        paintToolBtn.onclick = () => {
          editorMode = "paint"
          paintToolBtn.classList.add("active")
          eraseToolBtn.classList.remove("active")
        }
        editorTools.appendChild(paintToolBtn)

        const eraseToolBtn = document.createElement("button")
        eraseToolBtn.className = "tool-btn"
        eraseToolBtn.textContent = "🧹 橡皮"
        eraseToolBtn.onclick = () => {
          editorMode = "erase"
          eraseToolBtn.classList.add("active")
          paintToolBtn.classList.remove("active")
        }
        editorTools.appendChild(eraseToolBtn)

        editorSection.appendChild(editorTools)

        // 像素编辑网格
        const editorGridWrapper = document.createElement("div")
        editorGridWrapper.className = "editor-grid-wrapper"

        const editorGrid = document.createElement("div")
        editorGrid.className = "editor-grid"
        editorGridWrapper.appendChild(editorGrid)

        editorSection.appendChild(editorGridWrapper)

        // 调色板
        const editorPalette = document.createElement("div")
        editorPalette.className = "editor-palette"

        EDITOR_PALETTE.forEach((color, idx) => {
          const swatch = document.createElement("div")
          swatch.className = "palette-swatch"
          if (color === null) {
            swatch.classList.add("eraser")
            swatch.title = "透明/橡皮"
          } else {
            swatch.style.backgroundColor = color
            swatch.title = color
          }
          if (idx === 0) {
            // 默认选中第一个非透明色
          }
          swatch.onclick = () => {
            selectedColor = color
            editorMode = color === null ? "erase" : "paint"
            document.querySelectorAll(".roche-plugin-pixel-house .palette-swatch").forEach(s => s.classList.remove("selected"))
            swatch.classList.add("selected")
            if (color === null) {
              eraseToolBtn.classList.add("active")
              paintToolBtn.classList.remove("active")
            } else {
              paintToolBtn.classList.add("active")
              eraseToolBtn.classList.remove("active")
            }
          }
          if (color === "#1f2937") {
            swatch.classList.add("selected")
          }
          editorPalette.appendChild(swatch)
        })

        editorSection.appendChild(editorPalette)
        contentDraw.appendChild(editorSection)
        charModal.appendChild(contentDraw)

        // 底部操作栏
        const charFooter = document.createElement("div")
        charFooter.className = "char-footer"

        const charNameInput = document.createElement("input")
        charNameInput.type = "text"
        charNameInput.className = "char-name-input"
        charNameInput.placeholder = "角色名称..."
        charNameInput.value = state.characterName || ""
        charFooter.appendChild(charNameInput)

        if (state.characterSprite) {
          const removeCharBtn = document.createElement("button")
          removeCharBtn.className = "btn"
          removeCharBtn.textContent = "🗑️ 移除"
          removeCharBtn.style.fontSize = "12px"
          removeCharBtn.style.padding = "6px 12px"
          removeCharBtn.onclick = removeCharacter
          charFooter.appendChild(removeCharBtn)
        }

        const saveCharBtn = document.createElement("button")
        saveCharBtn.className = "btn"
        saveCharBtn.textContent = "💾 保存"
        saveCharBtn.onclick = saveCharacter
        charFooter.appendChild(saveCharBtn)

        const cancelCharBtn = document.createElement("button")
        cancelCharBtn.className = "btn"
        cancelCharBtn.textContent = "取消"
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
            pixel.dataset.x = x
            pixel.dataset.y = y
            pixel.onclick = () => handlePixelClick(x, y)
            canvas.appendChild(pixel)
            pixels[y][x] = pixel
          }
        }

        // ==================== 场景绘制 ====================
        function drawScene() {
          for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
              pixels[y][x].style.backgroundColor = "transparent"
              pixels[y][x].className = "pixel"
            }
          }

          const skyColor = state.isNight ? PALETTE.sky_night : PALETTE.sky_day
          const cloudColor = state.isNight ? PALETTE.cloud_night : PALETTE.cloud

          for (let y = 0; y < 16; y++) {
            for (let x = 0; x < GRID_W; x++) {
              pixels[y][x].style.backgroundColor = skyColor
            }
          }

          if (state.isNight) {
            state.stars.forEach((star, i) => {
              const px = pixels[star.y]?.[star.x]
              if (px) {
                px.style.backgroundColor = PALETTE.star
                if (star.blink) {
                  px.classList.add("star-anim")
                  px.style.animationDelay = `${i * 0.2}s`
                }
              }
            })
          }

          if (state.isNight) {
            drawCircle(28, 3, 2, PALETTE.moon)
            pixels[4][29].style.backgroundColor = "#e2e8f0"
            pixels[3][27].style.backgroundColor = "#e2e8f0"
          } else {
            drawCircle(4, 3, 2, PALETTE.sun)
            pixels[1][4].style.backgroundColor = PALETTE.sun
            pixels[3][1].style.backgroundColor = PALETTE.sun
            pixels[3][7].style.backgroundColor = PALETTE.sun
            pixels[6][4].style.backgroundColor = PALETTE.sun
          }

          drawCloud(8, 2, cloudColor)
          drawCloud(22, 4, cloudColor)
          drawCloud(30, 2, cloudColor)

          for (let y = 16; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
              pixels[y][x].style.backgroundColor = (x + y) % 2 === 0 ? PALETTE.grass : PALETTE.grass_dark
            }
          }

          for (let y = 20; y < GRID_H; y++) {
            for (let x = 15; x <= 19; x++) {
              pixels[y][x].style.backgroundColor = PALETTE.path
            }
          }

          // 房子
          const houseX = 10, houseY = 10, houseW = 16, houseH = 10

          for (let y = houseY + 3; y < houseY + houseH; y++) {
            for (let x = houseX; x < houseX + houseW; x++) {
              pixels[y][x].style.backgroundColor = (x + y) % 2 === 0 ? PALETTE.house_wall : PALETTE.house_wall_dark
            }
          }

          for (let x = houseX - 1; x < houseX + houseW + 1; x++) {
            pixels[houseY + 2][x].style.backgroundColor = PALETTE.roof_dark
          }
          for (let x = houseX; x < houseX + houseW; x++) {
            pixels[houseY + 1][x].style.backgroundColor = PALETTE.roof
          }
          for (let x = houseX + 2; x < houseX + houseW - 2; x++) {
            pixels[houseY][x].style.backgroundColor = PALETTE.roof
          }
          pixels[houseY][houseX + 4].style.backgroundColor = PALETTE.roof
          pixels[houseY][houseX + houseW - 5].style.backgroundColor = PALETTE.roof

          for (let y = houseY; y < houseY + 3; y++) {
            pixels[y][houseX + houseW - 3].style.backgroundColor = PALETTE.chimney
            pixels[y][houseX + houseW - 2].style.backgroundColor = PALETTE.chimney
          }

          if (!state.isNight || state.windowLit) {
            pixels[houseY - 1][houseX + houseW - 3].style.backgroundColor = PALETTE.smoke
            pixels[houseY - 1][houseX + houseW - 2].style.backgroundColor = PALETTE.smoke
            pixels[houseY - 2][houseX + houseW - 3].style.backgroundColor = PALETTE.smoke
            pixels[houseY - 2][houseX + houseW - 2].classList.add("smoke-anim")
            pixels[houseY - 2][houseX + houseW - 2].style.backgroundColor = PALETTE.smoke
          }

          const winColor = state.windowLit
            ? PALETTE.window_lit
            : (state.isNight ? PALETTE.window_dark : PALETTE.window)

          for (let y = houseY + 5; y < houseY + 8; y++) {
            for (let x = houseX + 2; x < houseX + 5; x++) {
              pixels[y][x].style.backgroundColor = winColor
            }
          }
          pixels[houseY + 6][houseX + 2].style.backgroundColor = PALETTE.door
          pixels[houseY + 6][houseX + 4].style.backgroundColor = PALETTE.door
          pixels[houseY + 5][houseX + 3].style.backgroundColor = PALETTE.door
          pixels[houseY + 7][houseX + 3].style.backgroundColor = PALETTE.door

          for (let y = houseY + 5; y < houseY + 8; y++) {
            for (let x = houseX + houseW - 6; x < houseX + houseW - 3; x++) {
              pixels[y][x].style.backgroundColor = winColor
            }
          }
          pixels[houseY + 6][houseX + houseW - 6].style.backgroundColor = PALETTE.door
          pixels[houseY + 6][houseX + houseW - 4].style.backgroundColor = PALETTE.door
          pixels[houseY + 5][houseX + houseW - 5].style.backgroundColor = PALETTE.door
          pixels[houseY + 7][houseX + houseW - 5].style.backgroundColor = PALETTE.door

          const doorX = houseX + 7, doorY = houseY + 6
          if (state.doorOpen) {
            for (let y = doorY; y < houseY + houseH; y++) {
              for (let x = doorX; x < doorX + 3; x++) {
                pixels[y][x].style.backgroundColor = PALETTE.door_open
              }
            }
            for (let y = doorY; y < houseY + houseH; y++) {
              pixels[y][doorX - 1].style.backgroundColor = PALETTE.door
              pixels[y][doorX + 3].style.backgroundColor = PALETTE.door
            }
          } else {
            for (let y = doorY; y < houseY + houseH; y++) {
              for (let x = doorX; x < doorX + 3; x++) {
                pixels[y][x].style.backgroundColor = PALETTE.door
              }
            }
            pixels[doorY + 2][doorX + 2].style.backgroundColor = "#fbbf24"
          }

          drawTree(3, 12)
          drawTree(30, 14)
          drawTree(33, 15)

          Object.entries(state.flowers).forEach(([key, type]) => {
            const [fx, fy] = key.split(",").map(Number)
            drawFlower(fx, fy, type)
          })

          for (let x = 0; x < GRID_W; x += 2) {
            if (x < houseX - 1 || x > houseX + houseW) {
              pixels[19][x].style.backgroundColor = PALETTE.fence
            }
          }

          // 角色像素形象
          drawCharacter()

          drawCat(state.catX, state.catY)

          drawWell(26, 18)
        }

        // ==================== 绘制函数 ====================
        function drawCircle(cx, cy, r, color) {
          for (let y = cy - r; y <= cy + r; y++) {
            for (let x = cx - r; x <= cx + r; x++) {
              if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) {
                const dx = x - cx, dy = y - cy
                if (dx * dx + dy * dy <= r * r + 0.5) {
                  pixels[y][x].style.backgroundColor = color
                }
              }
            }
          }
        }

        function drawCloud(cx, cy, color) {
          const positions = [
            [0, 0], [1, 0], [2, 0], [-1, 0],
            [0, -1], [1, -1], [-1, -1],
            [0, 1], [1, 1]
          ]
          positions.forEach(([dx, dy]) => {
            const x = cx + dx, y = cy + dy
            if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) {
              pixels[y][x].style.backgroundColor = color
            }
          })
        }

        function drawTree(x, y) {
          for (let ty = y; ty < y + 5; ty++) {
            pixels[ty][x].style.backgroundColor = PALETTE.trunk
            pixels[ty][x + 1].style.backgroundColor = PALETTE.trunk
          }
          for (let ly = y - 4; ly < y + 2; ly++) {
            for (let lx = x - 2; lx <= x + 3; lx++) {
              if (lx >= 0 && lx < GRID_W && ly >= 0) {
                const dist = Math.abs(lx - x - 0.5) + Math.abs(ly - y + 1)
                if (dist <= 3) {
                  pixels[ly][lx].style.backgroundColor = (lx + ly) % 2 === 0 ? PALETTE.leaves : PALETTE.leaves_dark
                }
              }
            }
          }
        }

        function drawFlower(x, y, type) {
          const colors = [PALETTE.flower_red, PALETTE.flower_pink, PALETTE.flower_purple, PALETTE.flower_white]
          const color = colors[(type - 1) % colors.length]
          if (y >= 0 && y < GRID_H && x >= 0 && x < GRID_W) {
            pixels[y][x].style.backgroundColor = PALETTE.grass_dark
            if (y - 1 >= 0) pixels[y - 1][x].style.backgroundColor = color
            if (y - 2 >= 0) {
              pixels[y - 2][x - 1].style.backgroundColor = color
              pixels[y - 2][x].style.backgroundColor = PALETTE.flower_center
              pixels[y - 2][x + 1].style.backgroundColor = color
            }
            if (y - 3 >= 0) pixels[y - 3][x].style.backgroundColor = color
          }
        }

        function drawWell(x, y) {
          if (x < 0 || x + 3 >= GRID_W || y < 0 || y + 2 >= GRID_H) return
          for (let wy = y; wy < y + 3; wy++) {
            for (let wx = x; wx < x + 3; wx++) {
              pixels[wy][wx].style.backgroundColor = PALETTE.fence
            }
          }
          pixels[y + 1][x + 1].style.backgroundColor = PALETTE.water
          pixels[y - 1][x].style.backgroundColor = PALETTE.fence
          pixels[y - 1][x + 2].style.backgroundColor = PALETTE.fence
          pixels[y - 2][x].style.backgroundColor = PALETTE.fence
          pixels[y - 2][x + 2].style.backgroundColor = PALETTE.fence
          pixels[y - 2][x + 1].style.backgroundColor = PALETTE.fence
        }

        function drawCat(x, y) {
          if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return
          const catColors = {
            orange: PALETTE.cat_orange, white: PALETTE.cat_white, black: PALETTE.cat_black
          }
          const c = catColors[state.catColor] || PALETTE.cat_orange
          if (y - 1 >= 0) pixels[y - 1][x].style.backgroundColor = c
          pixels[y][x].style.backgroundColor = c
          if (x + 1 < GRID_W) {
            if (y - 1 >= 0) pixels[y - 1][x + 1].style.backgroundColor = c
            pixels[y][x + 1].style.backgroundColor = c
          }
          if (y - 2 >= 0) {
            pixels[y - 2][x].style.backgroundColor = c
            if (x + 1 < GRID_W) pixels[y - 2][x + 1].style.backgroundColor = c
          }
          if (y - 3 >= 0) {
            pixels[y - 3][x].style.backgroundColor = c
            if (x + 1 < GRID_W) pixels[y - 3][x + 1].style.backgroundColor = c
          }
          if (x - 1 >= 0 && y - 1 >= 0) {
            pixels[y - 1][x - 1].style.backgroundColor = c
          }
          if (y - 2 >= 0) {
            pixels[y - 2][x].style.backgroundColor = "#1f2937"
            if (x + 1 < GRID_W) pixels[y - 2][x + 1].style.backgroundColor = "#1f2937"
            if (state.catDir > 0) {
              pixels[y - 2][x + 1].style.backgroundColor = "#f8fafc"
            } else {
              pixels[y - 2][x].style.backgroundColor = "#f8fafc"
            }
          }
          if (pixels[y][x]) pixels[y][x].classList.add("cat-anim")
        }

        function drawCharacter() {
          if (!state.characterSprite) return
          const sw = state.characterSprite.width
          const sh = state.characterSprite.height
          const spritePixels = state.characterSprite.pixels
          const topY = CHAR_BASE_Y - sh + 1 + charBob

          for (let py = 0; py < sh; py++) {
            for (let px = 0; px < sw; px++) {
              const color = spritePixels[py] && spritePixels[py][px]
              if (color) {
                const gx = CHAR_BASE_X + px
                const gy = topY + py
                if (gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H) {
                  pixels[gy][gx].style.backgroundColor = color
                }
              }
            }
          }
        }

        // ==================== 图片转像素 ====================
        function rgbToHex(r, g, b) {
          return "#" + [r, g, b].map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("")
        }

        function imageToPixelSprite(imgUrl, spriteW, spriteH) {
          return new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = "anonymous"

            img.onload = () => {
              try {
                const cv = document.createElement("canvas")
                cv.width = spriteW
                cv.height = spriteH
                const ctx = cv.getContext("2d")
                ctx.imageSmoothingEnabled = false

                const imgRatio = img.width / img.height
                const spriteRatio = spriteW / spriteH
                let sx, sy, sw, sh
                if (imgRatio > spriteRatio) {
                  sh = img.height
                  sw = sh * spriteRatio
                  sx = (img.width - sw) / 2
                  sy = 0
                } else {
                  sw = img.width
                  sh = sw / spriteRatio
                  sx = 0
                  sy = (img.height - sh) / 2
                }

                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, spriteW, spriteH)

                const data = ctx.getImageData(0, 0, spriteW, spriteH).data
                const result = []
                for (let y = 0; y < spriteH; y++) {
                  const row = []
                  for (let x = 0; x < spriteW; x++) {
                    const i = (y * spriteW + x) * 4
                    const alpha = data[i + 3]
                    if (alpha < 128) {
                      row.push(null)
                    } else {
                      row.push(rgbToHex(data[i], data[i + 1], data[i + 2]))
                    }
                  }
                  result.push(row)
                }
                resolve({ width: spriteW, height: spriteH, pixels: result })
              } catch (e) {
                reject(new Error("无法处理图片（可能是跨域限制），请尝试上传本地图片"))
              }
            }

            img.onerror = () => {
              // 尝试不带 crossOrigin
              const img2 = new Image()
              img2.onload = () => {
                try {
                  const cv = document.createElement("canvas")
                  cv.width = spriteW
                  cv.height = spriteH
                  const ctx = cv.getContext("2d")
                  ctx.imageSmoothingEnabled = false

                  const imgRatio = img2.width / img2.height
                  const spriteRatio = spriteW / spriteH
                  let sx, sy, sw, sh
                  if (imgRatio > spriteRatio) {
                    sh = img2.height
                    sw = sh * spriteRatio
                    sx = (img2.width - sw) / 2
                    sy = 0
                  } else {
                    sw = img2.width
                    sh = sw / spriteRatio
                    sx = 0
                    sy = (img2.height - sh) / 2
                  }

                  ctx.drawImage(img2, sx, sy, sw, sh, 0, 0, spriteW, spriteH)
                  const data = ctx.getImageData(0, 0, spriteW, spriteH).data
                  const result = []
                  for (let y = 0; y < spriteH; y++) {
                    const row = []
                    for (let x = 0; x < spriteW; x++) {
                      const i = (y * spriteW + x) * 4
                      const alpha = data[i + 3]
                      if (alpha < 128) {
                        row.push(null)
                      } else {
                        row.push(rgbToHex(data[i], data[i + 1], data[i + 2]))
                      }
                    }
                    result.push(row)
                  }
                  resolve({ width: spriteW, height: spriteH, pixels: result })
                } catch (e) {
                  reject(new Error("无法处理图片（跨域限制），请上传本地图片"))
                }
              }
              img2.onerror = () => reject(new Error("图片加载失败"))
              img2.src = imgUrl
            }

            img.src = imgUrl
          })
        }

        function createBlankSprite(w, h) {
          const px = []
          for (let y = 0; y < h; y++) {
            const row = []
            for (let x = 0; x < w; x++) row.push(null)
            px.push(row)
          }
          return { width: w, height: h, pixels: px }
        }

        // ==================== 角色弹窗功能 ====================
        function openCharPanel() {
          charNameInput.value = state.characterName || ""
          if (state.characterSprite) {
            workingSprite = JSON.parse(JSON.stringify(state.characterSprite))
          } else {
            workingSprite = createBlankSprite(DEFAULT_SPRITE_W, DEFAULT_SPRITE_H)
          }
          editorWInput.value = String(workingSprite.width)
          editorHInput.value = String(workingSprite.height)
          buildEditorGrid()
          charOverlay.classList.add("active")
          loadCharList()
        }

        function closeCharPanel() {
          charOverlay.classList.remove("active")
        }

        function switchTab(tabName) {
          document.querySelectorAll(".roche-plugin-pixel-house .char-tab").forEach(t => t.classList.remove("active"))
          document.querySelectorAll(".roche-plugin-pixel-house .char-tab-content").forEach(c => c.classList.remove("active"))

          if (tabName === "chars") {
            tabChars.classList.add("active")
            contentChars.classList.add("active")
            loadCharList()
          } else if (tabName === "upload") {
            tabUpload.classList.add("active")
            contentUpload.classList.add("active")
          } else if (tabName === "draw") {
            tabDraw.classList.add("active")
            contentDraw.classList.add("active")
            if (!workingSprite) {
              workingSprite = createBlankSprite(DEFAULT_SPRITE_W, DEFAULT_SPRITE_H)
            }
            buildEditorGrid()
          }
        }

        async function loadCharList() {
          contentChars.innerHTML = '<div class="char-loading">加载角色列表中...</div>'
          try {
            const chars = await roche.character.list()
            if (!chars || chars.length === 0) {
              contentChars.innerHTML = '<div class="char-empty">暂无角色，请先在 Roche 中创建角色</div>'
              return
            }

            contentChars.innerHTML = ""
            const listEl = document.createElement("div")
            listEl.className = "char-list"

            chars.forEach(char => {
              const item = document.createElement("div")
              item.className = "char-item"

              const displayName = char.handle || char.name || "未命名"
              const realName = char.name || ""

              if (char.avatar) {
                const avatar = document.createElement("img")
                avatar.className = "char-item-avatar"
                avatar.src = char.avatar
                avatar.onerror = () => {
                  avatar.style.display = "none"
                  placeholder.style.display = "flex"
                }
                item.appendChild(avatar)

                const placeholder = document.createElement("div")
                placeholder.className = "char-item-placeholder"
                placeholder.textContent = displayName.charAt(0) || "?"
                placeholder.style.display = "none"
                item.appendChild(placeholder)
              } else {
                const placeholder = document.createElement("div")
                placeholder.className = "char-item-placeholder"
                placeholder.textContent = displayName.charAt(0) || "?"
                item.appendChild(placeholder)
              }

              const info = document.createElement("div")
              const nameEl = document.createElement("div")
              nameEl.className = "char-item-name"
              nameEl.textContent = displayName
              info.appendChild(nameEl)

              if (realName && realName !== displayName) {
                const handleEl = document.createElement("div")
                handleEl.className = "char-item-handle"
                handleEl.textContent = realName
                info.appendChild(handleEl)
              }
              item.appendChild(info)

              item.onclick = () => selectCharacter(char)

              listEl.appendChild(item)
            })

            contentChars.appendChild(listEl)
          } catch (e) {
            contentChars.innerHTML = '<div class="char-error">无法加载角色列表：' + (e.message || "未知错误") + '</div>'
          }
        }

        async function selectCharacter(char) {
          const displayName = char.handle || char.name || "自定义角色"
          charNameInput.value = displayName

          if (!char.avatar) {
            roche.ui.toast("该角色没有头像，请尝试上传图片")
            return
          }

          contentChars.innerHTML = '<div class="char-loading">正在转换像素形象...</div>'

          try {
            const sprite = await imageToPixelSprite(char.avatar, DEFAULT_SPRITE_W, DEFAULT_SPRITE_H)
            workingSprite = sprite
            editorWInput.value = String(sprite.width)
            editorHInput.value = String(sprite.height)
            switchTab("draw")
            roche.ui.toast("已导入「" + displayName + "」的像素形象")
          } catch (e) {
            contentChars.innerHTML = '<div class="char-error">' + (e.message || "转换失败") + '<br><br>请尝试在「上传图片」标签页中上传本地图片</div>'
          }
        }

        function handleFileUpload(e) {
          const file = e.target.files[0]
          if (!file) return

          const reader = new FileReader()
          reader.onload = async (event) => {
            const dataUrl = event.target.result
            uploadPreview.innerHTML = '<div class="char-loading">正在像素化...</div>'

            const w = parseInt(widthSlider.value) || DEFAULT_SPRITE_W
            const h = parseInt(heightSlider.value) || DEFAULT_SPRITE_H

            try {
              const sprite = await imageToPixelSprite(dataUrl, w, h)
              workingSprite = sprite
              editorWInput.value = String(sprite.width)
              editorHInput.value = String(sprite.height)
              charNameInput.value = charNameInput.value || "自定义角色"
              uploadPreview.innerHTML = '<div style="color:#16a34a;font-weight:bold;">✓ 像素化完成！已导入编辑器</div>'
              switchTab("draw")
              roche.ui.toast("图片已像素化，可在编辑器中微调")
            } catch (err) {
              uploadPreview.innerHTML = '<div style="color:#dc2626;">' + (err.message || "处理失败") + '</div>'
            }
          }
          reader.readAsDataURL(file)
          e.target.value = ""
        }

        // ==================== 像素编辑器 ====================
        function buildEditorGrid() {
          if (!workingSprite) return
          editorGrid.innerHTML = ""
          editorGrid.style.gridTemplateColumns = `repeat(${workingSprite.width}, 22px)`
          editorGrid.style.gridTemplateRows = `repeat(${workingSprite.height}, 22px)`

          for (let y = 0; y < workingSprite.height; y++) {
            for (let x = 0; x < workingSprite.width; x++) {
              const cell = document.createElement("div")
              cell.className = "editor-cell"
              cell.dataset.x = x
              cell.dataset.y = y
              updateEditorCell(cell, workingSprite.pixels[y][x])
              cell.onclick = () => handleEditorClick(x, y)
              editorGrid.appendChild(cell)
            }
          }
        }

        function updateEditorCell(cell, color) {
          if (color) {
            cell.style.backgroundColor = color
            cell.classList.remove("transparent")
          } else {
            cell.style.backgroundColor = ""
            cell.classList.add("transparent")
          }
        }

        function handleEditorClick(x, y) {
          if (!workingSprite) return
          if (editorMode === "erase") {
            workingSprite.pixels[y][x] = null
          } else {
            workingSprite.pixels[y][x] = selectedColor
          }
          const idx = y * workingSprite.width + x
          const cell = editorGrid.children[idx]
          if (cell) updateEditorCell(cell, workingSprite.pixels[y][x])
        }

        async function saveCharacter() {
          if (!workingSprite) {
            roche.ui.toast("请先创建或导入角色形象")
            return
          }

          // 检查是否全空
          let hasContent = false
          for (let y = 0; y < workingSprite.height; y++) {
            for (let x = 0; x < workingSprite.width; x++) {
              if (workingSprite.pixels[y][x]) { hasContent = true; break }
            }
            if (hasContent) break
          }

          if (!hasContent) {
            roche.ui.toast("角色形象是空白的，请先绘制")
            return
          }

          state.characterSprite = workingSprite
          state.characterName = charNameInput.value.trim() || "自定义角色"
          await saveState()

          charBtn.textContent = "👤 编辑角色"
          closeCharPanel()
          drawScene()
          roche.ui.toast("角色形象已保存！")
        }

        async function removeCharacter() {
          state.characterSprite = null
          state.characterName = ""
          await saveState()
          charBtn.textContent = "👤 添加角色"
          closeCharPanel()
          drawScene()
          roche.ui.toast("角色形象已移除")
        }

        // ==================== 交互处理 ====================
        function handlePixelClick(x, y) {
          // 点击角色
          if (state.characterSprite) {
            const sw = state.characterSprite.width
            const sh = state.characterSprite.height
            const topY = CHAR_BASE_Y - sh + 1 + charBob
            if (x >= CHAR_BASE_X && x < CHAR_BASE_X + sw &&
                y >= topY && y <= CHAR_BASE_Y) {
              charJumping = true
              jumpFrame = 0
              if (state.characterName) {
                roche.ui.toast("👋 " + state.characterName)
              }
              return
            }
          }

          if (y < 16) { toggleDayNight(); return }

          if (x >= 17 && x <= 19 && y >= 16 && y <= 19) { toggleDoor(); return }

          if ((x >= 12 && x <= 14 && y >= 15 && y <= 17) ||
              (x >= 20 && x <= 22 && y >= 15 && y <= 17)) {
            toggleLight(); return
          }

          if (Math.abs(x - state.catX) <= 2 && Math.abs(y - state.catY) <= 3) {
            state.catDir *= -1
            saveState()
            drawScene()
            return
          }

          if (y >= 16 && y < GRID_H) {
            const key = `${x},${y}`
            const current = state.flowers[key] || 0
            if (current >= 4) {
              delete state.flowers[key]
            } else {
              state.flowers[key] = current + 1
            }
            saveState()
            drawScene()
          }
        }

        async function toggleDayNight() {
          state.isNight = !state.isNight
          dayNightBtn.textContent = state.isNight ? "☀️ 切换白天" : "🌙 切换黑夜"
          root.className = `roche-plugin-pixel-house ${state.isNight ? "night" : ""}`
          await saveState()
          drawScene()
        }

        async function toggleDoor() {
          state.doorOpen = !state.doorOpen
          doorBtn.textContent = state.doorOpen ? "🚪 关门" : "🚪 开门"
          await saveState()
          drawScene()
        }

        async function toggleLight() {
          state.windowLit = !state.windowLit
          lightBtn.textContent = state.windowLit ? "💡 关灯" : "💡 开灯"
          await saveState()
          drawScene()
        }

        async function resetFlowers() {
          state.flowers = {}
          await saveState()
          drawScene()
          roche.ui.toast("花园已重置")
        }

        async function changeCat() {
          const colors = ["orange", "white", "black"]
          const idx = colors.indexOf(state.catColor)
          state.catColor = colors[(idx + 1) % colors.length]
          await saveState()
          drawScene()
        }

        async function saveState() {
          try {
            await roche.storage.set("pixelHouseState", {
              isNight: state.isNight,
              doorOpen: state.doorOpen,
              windowLit: state.windowLit,
              flowers: state.flowers,
              catColor: state.catColor,
              characterSprite: state.characterSprite,
              characterName: state.characterName
            })
          } catch (e) {}
        }

        // ==================== 动画 ====================
        let animInterval = setInterval(() => {
          // 猫咪走动
          if (Math.random() > 0.3) {
            // 猫咪不移动时也更新角色动画
          } else {
            const newX = state.catX + state.catDir
            if (newX >= 1 && newX < GRID_W - 2) {
              if (newX < 10 || newX > 25) {
                state.catX = newX
              } else if (state.catY < 16) {
                state.catX = newX
              } else {
                if (Math.random() > 0.7) state.catX = newX
              }
            } else {
              state.catDir *= -1
            }
            if (Math.random() > 0.95) state.catDir *= -1
            state.catFrame = (state.catFrame + 1) % 4
          }

          // 角色动画
          if (charJumping) {
            jumpFrame++
            if (jumpFrame < 6) {
              charBob = -jumpFrame
            } else if (jumpFrame < 12) {
              charBob = -(12 - jumpFrame)
            } else {
              charJumping = false
              jumpFrame = 0
              charBob = 0
            }
          } else {
            // 呼吸动画
            charBob = Math.sin(Date.now() / 600) > 0 ? 0 : -1
          }

          drawScene()
        }, 400)

        // ==================== 初始化 ====================
        drawScene()

        // ==================== 清理 ====================
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
