/**
 * Copyright 2025 Hughe5
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import buttonCSS from './css/button.css?inline';
import tooltipCSS from './css/tooltip.css?inline';
import popupCSS from './css/popup.css?inline';
import alertCSS from './css/alert.css?inline';
import selectCSS from './css/select.css?inline';
import loadingCSS from './css/loading.css?inline';
import panelCSS from './css/panel.css?inline';
import commonCSS from './css/common.css?inline';

const combinedCSS = [
  buttonCSS,
  tooltipCSS,
  popupCSS,
  alertCSS,
  selectCSS,
  loadingCSS,
  panelCSS,
  commonCSS,
].join('\n');

const template: HTMLTemplateElement = document.createElement('template');

template.innerHTML = `
    <style>${combinedCSS}</style>
    <div class="app-container">
        <div class="messages-container" id="messages-container"></div>
        <div class="bottom-container">
            <div class="action-bar">
                <select id="model-select"></select>
                <button class="icon square plain tooltip margin-left-auto" id="create-button" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 1024 1024"><path d="M597.333 128v85.333H170.667v571.094l75.221-59.094h607.445V426.667h85.334V768A42.667 42.667 0 0 1 896 810.667H275.413L85.333 960V170.667A42.667 42.667 0 0 1 128 128h469.333zm213.334 0V0H896v128h128v85.333H896v128h-85.333v-128h-128V128h128z"/></svg>
                    <span class="tooltip-text bottom-left">新聊天</span>
                </button>
                <button class="icon square plain tooltip" id="history-button" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 1024 1024"><path d="M512 85.333c235.648 0 426.667 191.019 426.667 426.667S747.648 938.667 512 938.667a424.79 424.79 0 0 1-200.875-50.134L85.333 938.667 135.51 712.96A424.79 424.79 0 0 1 85.333 512C85.333 276.352 276.352 85.333 512 85.333zm0 85.334A341.333 341.333 0 0 0 170.667 512c0 56.96 13.909 111.701 40.106 160.683l14.934 27.904-27.99 125.696L323.5 798.379l27.861 14.89A339.413 339.413 0 0 0 512 853.333a341.333 341.333 0 1 0 0-682.666zm42.667 128V512h170.666v85.333h-256V298.667h85.334z"/></svg>
                    <span class="tooltip-text bottom-left">历史聊天</span>
                </button>
            </div>
            <div class="user-input-container" id="user-input-container">
                <textarea class="user-input" id="user-input" placeholder="和我聊天"></textarea>
                <div class="button-wrap">
                    <button class="icon square plain tooltip" id="submit-icon" type="button">
                        <div class="submit-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"><path d="M9 16V6.414L5.707 9.707a1 1 0 1 1-1.414-1.414l5-5 .076-.068a1 1 0 0 1 1.338.068l5 5 .068.076a1 1 0 0 1-1.406 1.406l-.076-.068L11 6.414V16a1 1 0 1 1-2 0Z"/></svg>
                        </div>
                        <span class="tooltip-text top-left">发送 (↵)</span>
                    </button>
                    <button style="display: none;" class="icon square plain tooltip" id="stop-icon" type="button">
                        <div class="stop-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"><path d="M4.5 5.75c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v8.5c0 .69-.56 1.25-1.25 1.25h-8.5c-.69 0-1.25-.56-1.25-1.25v-8.5Z"/></svg>
                        </div>
                        <span class="tooltip-text top-left">停止</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div class="popup" id="history-popup">
        <div class="popup-content-container">
            <div class="popup-header">
                <div class="popup-title">历史聊天</div>
                <button class="icon circle plain" id="history-popup-close" type="button">
                    <span class="close-icon">x</span>
                </button>
            </div>
            <div class="popup-content" id="history-popup-content"></div>
        </div>
    </div>
`;

export {template};
