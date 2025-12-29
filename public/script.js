class PPTXSurgeonUI {
    constructor() {
        this.currentFile = null;
        this.originalFileName = null;
        this.analysisData = null;
        this.ws = null;
        this.currentLanguage = 'en';
        this.currentStep = 1;

        this.translations = {
            ko: {
                step1Title: '파일 선택',
                step2Title: '폰트 분석',
                step3Title: '옵션 설정',
                step4Title: '수술 실행',
                uploadTitle: 'PPTX 파일 업로드',
                uploadText: '파일을 드래그하거나 클릭하여 선택하세요',
                securityNote: '파일은 수술 후 서버에서 즉시 삭제됩니다.',
                selectFile: '파일 선택',
                analyzeStart: '폰트 분석 시작',
                removeEmbed: '폰트 임베딩 제거',
                removeEmbedDesc: '깨진 폰트 임베딩 정보를 완전히 제거하여 오류를 해결합니다.',
                fontMapping: '폰트 이름 매핑',
                fontMappingDesc: '특정 폰트를 시스템에 있는 다른 폰트로 교체합니다.',
                fontCleanup: '올인원 폰트 정리',
                fontCleanupDesc: '선택한 폰트만 남기고 나머지는 모두 기본 폰트로 변경합니다.',
                verboseLog: '상세 로그 출력',
                verboseLogDesc: '수술 과정을 상세하게 확인합니다.',
                nextStep: '다음 단계로',
                processReady: '모든 준비가 완료되었습니다.',
                surgeryStart: '수술 시작',
                surgeryComplete: '수술 완료!',
                surgeryCompleteDesc: '폰트 문제가 성공적으로 해결되었습니다.',
                downloadResult: '결과 파일 다운로드',
                viewLog: '상세로그',
                goBack: '처음으로',
                appTitle: 'PPT Font Surgeon',
                appSubtitle: 'PowerPoint 폰트 문제 해결 전문 도구',
                backBtn: '뒤로',
                resetConfirm: '처음으로 돌아가시겠습니까? 진행 중인 작업은 저장되지 않습니다.'
            },
            en: {
                step1Title: 'Select File',
                step2Title: 'Analysis',
                step3Title: 'Options',
                step4Title: 'Process',
                uploadTitle: 'Upload PPTX File',
                uploadText: 'Drag and drop or click to select file',
                securityNote: 'Files are deleted immediately after processing.',
                selectFile: 'Select File',
                analyzeStart: 'Start Font Analysis',
                removeEmbed: 'Remove Embeddings',
                removeEmbedDesc: 'Completely remove broken font embedding information.',
                fontMapping: 'Font Mapping',
                fontMappingDesc: 'Replace specific fonts with valid system fonts.',
                fontCleanup: 'Font Cleanup',
                fontCleanupDesc: 'Keep selected fonts and map everything else to default.',
                verboseLog: 'Verbose Logging',
                verboseLogDesc: 'Show detailed logs during the process.',
                nextStep: 'Next Step',
                processReady: 'Ready to Process',
                surgeryStart: 'Start Surgery',
                surgeryComplete: 'Surgery Complete!',
                surgeryCompleteDesc: 'Font issues have been successfully resolved.',
                downloadResult: 'Download Result',
                viewLog: 'View Log',
                goBack: 'Start Over',
                appTitle: 'PPT Font Surgeon',
                appSubtitle: 'Professional Tool for PowerPoint Fonts',
                backBtn: 'Back',
                resetConfirm: 'Are you sure you want to start over? Current progress will be lost.'
            }
        };

        this.init();
    }

    init() {
        this.setupWebSocket();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupImageRotation();
        this.setupThemeToggle();
        this.setupLanguageToggle();
        this.loadLanguage();

        // Initial icon render
        lucide.createIcons();
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const basePath = window.location.pathname.replace(/\/$/, ''); // e.g., /PPTFONT
        this.ws = new WebSocket(`${protocol}//${window.location.host}${basePath}/ws`);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };

        this.ws.onclose = () => {
            setTimeout(() => this.setupWebSocket(), 3000);
        };

        this.ws.onerror = (err) => {
            console.log('WebSocket error, will retry...');
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'progress':
                this.updateProgress(data.progress, data.message);
                break;
            case 'verbose':
                this.updateProgress(data.progress, data.message);
                this.showVerboseLog(data.message);
                break;
            case 'error':
                this.showToast(data.message, 'error');
                this.hideProgress();
                break;
        }
    }

    setupEventListeners() {
        // File input
        document.getElementById('fileInput').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        document.getElementById('removeFileBtn').addEventListener('click', () => {
            this.removeFile();
        });

        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeFile();
        });

        document.getElementById('confirmOptionsBtn').addEventListener('click', () => {
            this.activateStep(4);
        });

        document.getElementById('processBtn').addEventListener('click', () => {
            this.processFile();
        });

        // Toggle visibility
        document.getElementById('enableMapping').addEventListener('change', (e) => {
            document.getElementById('fontMappings').style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('enableCleanup').addEventListener('change', (e) => {
            document.getElementById('cleanupOptions').style.display = e.target.checked ? 'block' : 'none';
        });

        // Header Title Click to Reset
        const headerTitle = document.querySelector('.header-text h1');
        if (headerTitle) {
            headerTitle.style.cursor = 'pointer';
            headerTitle.addEventListener('click', () => {
                if (this.currentStep > 1) {
                    const t = this.translations[this.currentLanguage];
                    if (confirm(t.resetConfirm)) {
                        location.reload();
                    }
                }
            });
        }
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragover'), false);
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleFileSelect(file) {
        if (!file || !file.name.toLowerCase().endsWith('.pptx')) {
            this.showToast('PPTX 파일만 선택할 수 있습니다.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('pptxFile', file);

        try {
            this.showToast('파일 업로드 중...', 'info');

            const response = await fetch('upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.currentFile = result.filename;
                this.originalFileName = result.originalName;
                this.showFileInfo(result.originalName);
                this.activateStep(2);
                this.showToast('파일 업로드 완료!', 'success');
            } else {
                this.showToast('파일 업로드 실패: ' + result.error, 'error');
            }
        } catch (error) {
            this.showToast('파일 업로드 중 오류가 발생했습니다.', 'error');
        }
    }

    showFileInfo(originalName) {
        document.getElementById('fileName').textContent = originalName;
    }

    removeFile() {
        this.currentFile = null;
        this.originalFileName = null;
        this.analysisData = null;
        document.getElementById('fileInput').value = '';
        document.getElementById('analysisResult').style.display = 'none';
        document.getElementById('analysisResult').innerHTML = '';
        this.activateStep(1);
    }

    async analyzeFile() {
        if (!this.currentFile) {
            this.showToast('먼저 파일을 선택해주세요.', 'error');
            return;
        }

        try {
            const btn = document.getElementById('analyzeBtn');
            const originalContent = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 분석 중...'; // Fallback if lucide not re-rendered yet, though we are careful

            // Re-render lucide icons immediately for spinning loader if possible, but FontAwesome spin class works on 'i' tags generally if FA is present. 
            // Since we removed FA, we should use a simple text or Lucide based spinner.
            // Let's rely on text or a simple SVG spinner.
            btn.innerHTML = '분석 중...';

            const response = await fetch('analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: this.currentFile })
            });

            const result = await response.json();

            if (result.success) {
                this.analysisData = result.analysis;
                this.displayAnalysis(result.analysis);
                this.activateStep(3);
                this.showToast('폰트 분석 완료!', 'success');
            } else {
                this.showToast('분석 실패: ' + result.error, 'error');
            }
        } catch (error) {
            this.showToast('분석 중 오류가 발생했습니다.', 'error');
        } finally {
            const btn = document.getElementById('analyzeBtn');
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="search"></i> 폰트 분석 시작';
            lucide.createIcons();
        }
    }

    displayAnalysis(analysis) {
        const resultDiv = document.getElementById('analysisResult');
        resultDiv.innerHTML = `<pre>${analysis}</pre>`;
        resultDiv.style.display = 'block';

        this.parseFontInfo(analysis);
    }

    parseFontInfo(analysis) {
        const embeddedFonts = new Set();
        const lines = analysis.split('\n');
        let inEmbedList = false;

        for (const line of lines) {
            if (line.includes('fontEmbedList:')) {
                inEmbedList = true;
                continue;
            }
            if (inEmbedList && line.includes('fontTheme:')) {
                inEmbedList = false;
                continue;
            }
            if (inEmbedList && line.includes('typeface:')) {
                const match = line.match(/typeface:\s*(.+)/);
                if (match) {
                    embeddedFonts.add(match[1].trim());
                }
            }
        }

        const referencedFonts = new Set();
        let inFontRefs = false;

        for (const line of lines) {
            if (line.includes('fontRefs:')) {
                inFontRefs = true;
                continue;
            }
            if (inFontRefs && line.trim() && !line.includes(':') && line.includes(' ')) {
                const match = line.match(/^\s*([^:]+):\s*\d+/);
                if (match) {
                    const fontName = match[1].trim();
                    if (!fontName.startsWith('+')) {
                        referencedFonts.add(fontName);
                    }
                }
            }
        }

        const allFonts = new Set([...embeddedFonts, ...referencedFonts]);

        this.updateFontSelectors(Array.from(allFonts));
        this.updateFontCheckboxes(Array.from(embeddedFonts), Array.from(referencedFonts));
    }

    updateFontSelectors(fonts) {
        const mappingItems = document.querySelectorAll('.mapping-item');
        mappingItems.forEach(item => {
            const fromSelect = item.querySelector('.mapping-from');
            const toSelect = item.querySelector('.mapping-to');

            while (fromSelect.children.length > 1) fromSelect.removeChild(fromSelect.lastChild);
            while (toSelect.children.length > 1) toSelect.removeChild(toSelect.lastChild);

            fonts.forEach(font => {
                const fromOption = document.createElement('option');
                fromOption.value = font;
                fromOption.textContent = font;
                fromSelect.appendChild(fromOption);

                const toOption = document.createElement('option');
                toOption.value = font;
                toOption.textContent = font;
                toSelect.appendChild(toOption);
            });
        });
    }

    updateFontCheckboxes(embeddedFonts, referencedFonts) {
        const fontList = document.getElementById('fontList');
        fontList.innerHTML = '';

        embeddedFonts.forEach(font => {
            const fontItem = document.createElement('div');
            fontItem.className = 'font-item';
            fontItem.innerHTML = `
                <input type="checkbox" id="font-${font.replace(/\s+/g, '-')}" value="${font}">
                <label for="font-${font.replace(/\s+/g, '-')}" title="${font}">${font} <span style="color: #10b981; font-size: 0.75rem;">(임베딩)</span></label>
            `;
            fontList.appendChild(fontItem);
        });

        referencedFonts.forEach(font => {
            if (!embeddedFonts.includes(font)) {
                const fontItem = document.createElement('div');
                fontItem.className = 'font-item';
                fontItem.innerHTML = `
                    <input type="checkbox" id="font-${font.replace(/\s+/g, '-')}" value="${font}">
                    <label for="font-${font.replace(/\s+/g, '-')}" title="${font}">${font} <span style="color: #ef4444; font-size: 0.75rem;">(참조)</span></label>
                `;
                fontList.appendChild(fontItem);
            }
        });
    }

    addMappingItem() {
        const container = document.getElementById('mappingContainer');
        const mappingItem = document.createElement('div');
        mappingItem.className = 'mapping-item';
        mappingItem.innerHTML = `
            <select class="mapping-from"><option value="">기존 폰트</option></select>
            <i data-lucide="arrow-right" style="color: var(--text-muted)"></i>
            <select class="mapping-to"><option value="">새 폰트</option></select>
            <button class="btn btn-danger btn-sm" onclick="removeMappingItem(this)">
                <i data-lucide="trash-2"></i>
            </button>
        `;

        container.appendChild(mappingItem);

        // Populate only the new item's options if analysis data exists
        // We can reuse the logic but target only the new item
        if (this.analysisData) {
            const fonts = this.getFontListFromAnalysis(this.analysisData);
            this.populateSelectOptions(mappingItem.querySelector('.mapping-from'), fonts);
            this.populateSelectOptions(mappingItem.querySelector('.mapping-to'), fonts);
        }

        lucide.createIcons();
    }

    getFontListFromAnalysis(analysis) {
        // Extract similar logic from parseFontInfo but return array
        const embeddedFonts = new Set();
        const lines = analysis.split('\n');
        let inEmbedList = false;

        for (const line of lines) {
            if (line.includes('fontEmbedList:')) { inEmbedList = true; continue; }
            if (inEmbedList && line.includes('fontTheme:')) { inEmbedList = false; continue; }
            if (inEmbedList && line.includes('typeface:')) {
                const match = line.match(/typeface:\s*(.+)/);
                if (match) embeddedFonts.add(match[1].trim());
            }
        }

        const referencedFonts = new Set();
        let inFontRefs = false;
        for (const line of lines) {
            if (line.includes('fontRefs:')) { inFontRefs = true; continue; }
            if (inFontRefs && line.trim() && !line.includes(':') && line.includes(' ')) {
                const match = line.match(/^\s*([^:]+):\s*\d+/);
                if (match) {
                    const fontName = match[1].trim();
                    if (!fontName.startsWith('+')) referencedFonts.add(fontName);
                }
            }
        }
        return Array.from(new Set([...embeddedFonts, ...referencedFonts]));
    }

    populateSelectOptions(selectElement, fonts) {
        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            selectElement.appendChild(option);
        });
    }

    removeMappingItem(button) {
        // If it's the last item, just clear values instead of removing
        const container = document.getElementById('mappingContainer');
        if (container.children.length <= 1) {
            const item = button.closest('.mapping-item');
            item.querySelector('.mapping-from').value = '';
            item.querySelector('.mapping-to').value = '';
            return;
        }
        button.closest('.mapping-item').remove();
    }

    async processFile() {
        if (!this.currentFile) {
            this.showToast('먼저 파일을 선택해주세요.', 'error');
            return;
        }

        const options = this.collectOptions();

        try {
            document.getElementById('processBtn').disabled = true;
            this.showProgress();

            const response = await fetch('process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: this.currentFile,
                    originalName: this.originalFileName,
                    options: options
                })
            });

            console.log('Process response status:', response.status);
            const result = await response.json();
            console.log('Process result:', result);

            if (response.ok && result.success) {
                this.showResult(result.outputFile);
                this.showToast('폰트 수술 완료!', 'success');
            } else {
                const errorMsg = result.error || `HTTP ${response.status}`;
                console.error('Surgery failed:', errorMsg);
                this.showToast('수술 실패: ' + errorMsg, 'error');
                this.hideProgress();
            }
        } catch (error) {
            console.error('Process error:', error);
            this.showToast('수술 중 오류: ' + error.message, 'error');
            this.hideProgress();
        } finally {
            document.getElementById('processBtn').disabled = false;
        }
    }

    collectOptions() {
        const options = {
            removeEmbed: document.getElementById('removeEmbed').checked,
            verbose: document.getElementById('verbose').checked,
            fontMappings: [],
            fontCleanup: ''
        };

        if (document.getElementById('enableMapping').checked) {
            const mappingItems = document.querySelectorAll('.mapping-item');
            mappingItems.forEach(item => {
                const from = item.querySelector('.mapping-from').value.trim();
                const to = item.querySelector('.mapping-to').value.trim();
                if (from && to) {
                    options.fontMappings.push({ from, to });
                }
            });
        }

        if (document.getElementById('enableCleanup').checked) {
            const selectedFonts = [];
            const checkboxes = document.querySelectorAll('#fontList input[type="checkbox"]:checked');
            checkboxes.forEach(checkbox => {
                selectedFonts.push(checkbox.value);
            });
            options.fontCleanup = selectedFonts.join(',');
        }

        return options;
    }

    showProgress() {
        document.getElementById('progressContainer').style.display = 'block';
        document.getElementById('startProcessContainer').style.display = 'none';

        this.updateProgress(0, '준비 중...');

        const isVerbose = document.getElementById('verbose').checked;
        document.getElementById('modalLogContent').innerHTML = ''; // Clear modal log

        if (isVerbose) {
            document.getElementById('verboseLog').style.display = 'block';
            document.getElementById('logContent').innerHTML = '';
        }
    }

    showVerboseLog(message) {
        // Clean up and format the message
        let cleanMessage = message
            .replace(/^ERROR:\s*/gm, '')  // Remove ERROR: prefix
            .replace(/^pptx-surgeon:\s*/gm, '')  // Remove pptx-surgeon: prefix
            .trim();

        // Skip empty messages
        if (!cleanMessage) return;

        // Format message with icons based on content
        let formattedMessage = cleanMessage;

        // Remove INFO: and DEBUG: prefixes, add icons
        if (cleanMessage.includes('INFO:')) {
            formattedMessage = '📋 ' + cleanMessage.replace('INFO:', '').trim();
        } else if (cleanMessage.includes('DEBUG:')) {
            // Skip verbose file operations
            if (cleanMessage.includes('retrieved OpenXML') || cleanMessage.includes('storing OpenXML')) {
                return;
            }
            formattedMessage = '🔧 ' + cleanMessage.replace('DEBUG:', '').trim();
        }

        // Add specific icons for key actions
        if (cleanMessage.includes('read PPTX')) {
            formattedMessage = '📂 파일 읽기 완료';
        } else if (cleanMessage.includes('parsing PPTX')) {
            formattedMessage = '🔍 PPTX 파일 분석 중...';
        } else if (cleanMessage.includes('embedded font')) {
            const fontName = cleanMessage.match(/typeface=([^,]+)/)?.[1] || '';
            formattedMessage = '🔤 임베디드 폰트: ' + fontName;
        } else if (cleanMessage.includes('font usage')) {
            const match = cleanMessage.match(/font usage: (.+)=(\d+)/);
            if (match) {
                formattedMessage = '📊 폰트 사용: ' + match[1] + ' (' + match[2] + '회)';
            }
        } else if (cleanMessage.includes('remove font embedding')) {
            formattedMessage = '✂️ 폰트 임베딩 제거 중...';
        } else if (cleanMessage.includes('removing PPTX part') && cleanMessage.includes('fntdata')) {
            const fontFile = cleanMessage.match(/font\d+\.fntdata/)?.[0] || '';
            formattedMessage = '🗑️ 폰트 파일 제거: ' + fontFile;
        } else if (cleanMessage.includes('packing PPTX')) {
            formattedMessage = '📦 PPTX 파일 재패킹 중...';
        } else if (cleanMessage.includes('write PPTX file')) {
            const match = cleanMessage.match(/write PPTX file (.+): (\d+) bytes/);
            if (match) {
                const sizeKB = Math.round(parseInt(match[2]) / 1024);
                formattedMessage = '✅ 저장 완료: ' + match[1].split('/').pop() + ' (' + sizeKB + ' KB)';
            }
        } else if (cleanMessage.includes('created temporary')) {
            formattedMessage = '📁 임시 폴더 생성됨';
        }

        // Update both inline log and modal log
        const logContent = document.getElementById('logContent');
        if (logContent) {
            const div = document.createElement('div');
            div.textContent = formattedMessage;
            logContent.appendChild(div);
            logContent.scrollTop = logContent.scrollHeight;
        }

        const modalLogContent = document.getElementById('modalLogContent');
        if (modalLogContent) {
            const div = document.createElement('div');
            div.textContent = formattedMessage;
            div.style.marginBottom = '4px';
            modalLogContent.appendChild(div);
            modalLogContent.scrollTop = modalLogContent.scrollHeight;
        }
    }

    updateProgress(percent, message) {
        document.getElementById('progressFill').style.width = percent + '%';
        document.getElementById('progressText').textContent = message;
    }

    hideProgress() {
        document.getElementById('progressContainer').style.display = 'none';
        document.getElementById('startProcessContainer').style.display = 'block';
    }

    showResult(outputFile) {
        document.getElementById('progressContainer').style.display = 'none'; // Hide progress
        document.getElementById('startProcessContainer').style.display = 'none'; // Ensure this is hiding
        document.getElementById('resultContainer').style.display = 'block';

        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.onclick = () => {
            window.location.href = `download/${outputFile}`;
        };

        lucide.createIcons();
    }

    activateStep(stepNumber) {
        this.currentStep = stepNumber;

        // Hide all steps first
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('active');
        });

        // Show current step content
        const currentContent = document.getElementById(`step${stepNumber}`);
        if (currentContent) currentContent.classList.add('active');

        // Update Stepper Navigation
        document.querySelectorAll('.step-item').forEach((item, index) => {
            const itemStep = index + 1;
            item.classList.remove('active', 'completed');

            if (itemStep === stepNumber) {
                item.classList.add('active');
            } else if (itemStep < stepNumber) {
                item.classList.add('completed');
            }
        });

        // Ensure Icons are rendered if newly shown content has them
        lucide.createIcons();
    }

    setupImageRotation() {
        const images = document.querySelectorAll('.header-img');
        let currentIndex = 0;
        if (images.length === 0) return;

        setInterval(() => {
            const nextIndex = (currentIndex + 1) % images.length;
            images[currentIndex].classList.remove('active');
            images[nextIndex].classList.add('active');
            currentIndex = nextIndex;
        }, 2500);
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');

        const savedTheme = localStorage.getItem('pptx-surgeon-theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeIcon.setAttribute('data-lucide', 'sun');
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');

            themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
            localStorage.setItem('pptx-surgeon-theme', isDark ? 'dark' : 'light');
            lucide.createIcons();
        });
    }

    setupLanguageToggle() {
        const languageToggle = document.getElementById('languageToggle');
        const languageText = document.getElementById('languageText');

        const savedLanguage = localStorage.getItem('pptx-surgeon-language');
        if (savedLanguage) {
            this.currentLanguage = savedLanguage;
            languageText.textContent = savedLanguage === 'ko' ? '한' : 'EN';
        }

        languageToggle.addEventListener('click', () => {
            this.currentLanguage = this.currentLanguage === 'ko' ? 'en' : 'ko';
            languageText.textContent = this.currentLanguage === 'ko' ? '한' : 'EN';
            localStorage.setItem('pptx-surgeon-language', this.currentLanguage);
            this.updateLanguage();
        });
    }

    loadLanguage() {
        const savedLanguage = localStorage.getItem('pptx-surgeon-language');
        if (savedLanguage) {
            this.currentLanguage = savedLanguage;
            document.getElementById('languageText').textContent = savedLanguage === 'ko' ? '한' : 'EN';
        }
        this.updateLanguage();
    }

    updateLanguage() {
        const t = this.translations[this.currentLanguage];

        // Update Step Titles
        const stepLabels = document.querySelectorAll('.step-label');
        if (stepLabels[0]) stepLabels[0].textContent = t.step1Title;
        if (stepLabels[1]) stepLabels[1].textContent = t.step2Title;
        if (stepLabels[2]) stepLabels[2].textContent = t.step3Title;
        if (stepLabels[3]) stepLabels[3].textContent = t.step4Title;

        // Step 1
        const uploadTitle = document.querySelector('.upload-text h3');
        if (uploadTitle) uploadTitle.textContent = t.uploadTitle;
        const uploadText = document.querySelector('.upload-text p');
        if (uploadText) uploadText.textContent = t.uploadText;
        const securityNote = document.querySelector('.security-note');
        if (securityNote) {
            securityNote.style.display = 'flex';
            securityNote.style.alignItems = 'center';
            securityNote.style.justifyContent = 'center';
            securityNote.style.gap = '6px';
            securityNote.innerHTML = `<i data-lucide="info" style="width: 14px; height: 14px;"></i> <span>${t.securityNote}</span>`;
        }

        const selectFileBtn = document.querySelector('.upload-area .btn');
        if (selectFileBtn) {
            // retain icon
            selectFileBtn.childNodes[0].textContent = '';
            selectFileBtn.innerHTML = `<i data-lucide="folder-open"></i> ${t.selectFile}`;
        }

        // Step 2 & 3 & 4 - Update button texts safely
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) analyzeBtn.innerHTML = `<i data-lucide="search"></i> ${t.analyzeStart}`;

        const confirmOptionsBtn = document.getElementById('confirmOptionsBtn');
        if (confirmOptionsBtn) confirmOptionsBtn.innerHTML = `${t.nextStep} <i data-lucide="arrow-right"></i>`;

        const processBtn = document.getElementById('processBtn');
        if (processBtn) processBtn.innerHTML = `<i data-lucide="play"></i> ${t.surgeryStart}`;

        // Back button in step 4. It's the first button in the flex container we added
        const step4BackBtn = document.querySelector('#startProcessContainer .btn-secondary');
        if (step4BackBtn) step4BackBtn.innerHTML = `<i data-lucide="arrow-left"></i> ${t.backBtn}`;

        const processReady = document.querySelector('#startProcessContainer h3');
        if (processReady) processReady.textContent = t.processReady;

        // Options Text
        const optionTitles = document.querySelectorAll('.option-title');
        const optionDescs = document.querySelectorAll('.option-desc');

        if (optionTitles[0]) optionTitles[0].textContent = t.removeEmbed;
        if (optionDescs[0]) optionDescs[0].textContent = t.removeEmbedDesc;

        if (optionTitles[1]) optionTitles[1].textContent = t.fontMapping;
        if (optionDescs[1]) optionDescs[1].textContent = t.fontMappingDesc;

        if (optionTitles[2]) optionTitles[2].textContent = t.fontCleanup;
        if (optionDescs[2]) optionDescs[2].textContent = t.fontCleanupDesc;

        if (optionTitles[3]) optionTitles[3].textContent = t.verboseLog;
        if (optionDescs[3]) optionDescs[3].textContent = t.verboseLogDesc; // Assuming verbose log is 4th

        // Result
        const successTitle = document.querySelector('.success-message h3');
        if (successTitle) successTitle.textContent = t.surgeryComplete;
        const successDesc = document.querySelector('.success-message p');
        if (successDesc) successDesc.textContent = t.surgeryCompleteDesc;
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) downloadBtn.innerHTML = `<i data-lucide="download"></i> ${t.downloadResult}`;

        // Update the two secondary buttons in success-message
        const successBtns = document.querySelectorAll('.success-message .btn-secondary');
        if (successBtns[0]) successBtns[0].innerHTML = `<i data-lucide="list"></i> ${t.viewLog || '상세로그'}`;
        if (successBtns[1]) successBtns[1].innerHTML = `<i data-lucide="rotate-ccw"></i> ${t.goBack}`;

        lucide.createIcons();
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const iconName = type === 'success' ? 'check-circle' :
            type === 'error' ? 'alert-circle' :
                'info';

        toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;

        document.getElementById('toastContainer').appendChild(toast);
        lucide.createIcons();

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Global Wrappers
function addMappingItem() {
    window.surgeonUI.addMappingItem();
}

function removeMappingItem(button) {
    window.surgeonUI.removeMappingItem(button);
}

function closeSplash() {
    const splash = document.getElementById('splashModal');
    splash.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => {
        splash.classList.add('hidden');
    }, 300);
}

function openSplash() {
    const splash = document.getElementById('splashModal');
    splash.classList.remove('hidden');
    splash.style.animation = 'fadeIn 0.3s ease';
    lucide.createIcons();
}

function openImageViewer() {
    event.stopPropagation();
    const viewer = document.getElementById('imageViewer');
    viewer.classList.remove('hidden');
    lucide.createIcons();
}

function closeImageViewer() {
    const viewer = document.getElementById('imageViewer');
    viewer.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    window.surgeonUI = new PPTXSurgeonUI();

    // Setup header image click to open splash
    const headerImages = document.querySelector('.header-images');
    if (headerImages) {
        headerImages.addEventListener('click', openSplash);
    }

    // Initialize splash modal icons
    lucide.createIcons();

    // Auto-hide splash after shown (or keep it for first visit)
    // To show splash on first load, remove the next line
    document.getElementById('splashModal').classList.add('hidden');
});