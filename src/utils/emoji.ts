export interface Emoji {
    id: string | number;
    name: string;
    src: string;
}

export const emojiList: Emoji[] = [
    { id: 1, name: '微笑', src: 'smile' },
    { id: 2, name: '臉紅', src: 'blush' },
    { id: 3, name: '害羞', src: 'relaxed' },
    { id: 4, name: '眨眼', src: 'wink' },
    { id: 5, name: '色', src: 'heart_eyes' },
    { id: 6, name: '親吻', src: 'kissing_heart' },
    { id: 7, name: '調皮', src: 'stuck_out_tongue_winking_eye' },
    { id: 8, name: '吐舌', src: 'stuck_out_tongue_closed_eyes' },
    { id: 9, name: '露齒笑', src: 'grin' },
    { id: 10, name: '悲傷', src: 'pensive' },
    { id: 11, name: '欣慰', src: 'relieved' },
    { id: 12, name: '失望', src: 'disappointed' },
    { id: 13, name: '哭泣', src: 'sob' },
    { id: 14, name: '眼困', src: 'sleepy' },
    { id: 15, name: '冷汗', src: 'cold_sweat' },
    { id: 16, name: '厭倦', src: 'weary' },
    { id: 17, name: '害怕', src: 'fearful' },
    { id: 18, name: '驚叫', src: 'scream' },
    { id: 19, name: '生氣', src: 'angry' },
    { id: 20, name: '憤怒', src: 'rage' },
    { id: 21, name: '口罩', src: 'mask' },
    { id: 22, name: '墨鏡', src: 'sunglasses' },
    { id: 23, name: '睡覺', src: 'sleeping' },
    { id: 24, name: '輕蔑', src: 'smirk' },
    { id: 25, name: '痛苦', src: 'anguished' },
    { id: 26, name: '惡魔', src: 'imp' },
    { id: 27, name: '男孩', src: 'boy' },
    { id: 28, name: '女孩', src: 'girl' },
    { id: 29, name: '男士', src: 'man' },
    { id: 30, name: '女士', src: 'woman' },
    { id: 31, name: '老男人', src: 'older_man' },
    { id: 32, name: '老女人', src: 'older_woman' },
    { id: 33, name: '嬰兒', src: 'baby' },
    { id: 34, name: '天使', src: 'angel' },
    { id: 35, name: '發炎', src: 'anger' },
    { id: 36, name: '沖', src: 'dash' },
    { id: 37, name: '耳朵', src: 'ear' },
    { id: 38, name: '眼睛', src: 'eyes' },
    { id: 39, name: '舌頭', src: 'tongue' },
    { id: 40, name: '嘴唇', src: 'lips' },
    { id: 41, name: '鼻子', src: 'nose' },
    { id: 42, name: '肌肉', src: 'muscle' },
    { id: 43, name: '拳頭', src: 'facepunch' },
    { id: 44, name: '手', src: 'hand' },
    { id: 45, name: '鼓掌', src: 'clap' },
    { id: 46, name: '弱', src: '-1' },
    { id: 47, name: '讚', src: '+1' },
    { id: 48, name: 'ok', src: 'ok_hand' },
    { id: 49, name: 'v', src: 'v' },
    { id: 50, name: '祈禱', src: 'pray' },
    { id: 51, name: '新娘', src: 'bride_with_veil' },
    { id: 52, name: '家庭', src: 'family' },
    { id: 53, name: '情侶', src: 'couple' },
    { id: 54, name: '按摩', src: 'massage' },
    { id: 55, name: '舉手', src: 'raising_hand' },
    { id: 56, name: '紅心', src: 'heart' },
    { id: 57, name: '丘比特', src: 'cupid' },
    { id: 58, name: '愛心', src: 'gift_heart' },
    { id: 59, name: '心動', src: 'heartbeat' },
    { id: 60, name: '心碎', src: 'broken_heart' },
];

export const convertHtmlToEmojiPlaceholder = (html: string): string => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const images = tempDiv.querySelectorAll('img[data-emoji-src]');
    images.forEach((img) => {
        const emojiSrc = img.getAttribute('data-emoji-src');
        if (emojiSrc) {
            const textNode = document.createTextNode(`[:${emojiSrc}]`);
            img.parentNode?.replaceChild(textNode, img);
        }
    });
    return tempDiv.innerHTML;
};

export const convertEmojiPlaceholderToHtml = (
    textWithPlaceholders: string,
    emojis: typeof emojiList,
): string => {
    let html = textWithPlaceholders;
    if (!html) return '';
    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    emojis.forEach((emoji) => {
        const escapedEmojiSrc = escapeRegExp(emoji.src);
        const placeholderPattern = `\\[:${escapedEmojiSrc}\\]`;
        const imgTag = `<img src="/vipemotions/${emoji.src}.png" alt="${emoji.name}" data-emoji-name="${emoji.name}" data-emoji-src="${emoji.src}" style="width: 17px; height: 17px; vertical-align: middle; margin: 0 1px;" contenteditable="false" draggable="false" />`;
        try {
            html = html.replace(new RegExp(placeholderPattern, 'g'), imgTag);
        } catch (e) {
            console.error(
                'Error replacing emoji placeholder:',
                e,
                'Pattern:',
                placeholderPattern,
            );
        }
    });
    return html;
};

export const handleEmojiKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    signatureDivRefCurrent: HTMLDivElement | null,
    updateSignatureCallback: (newHtml: string) => void,
): boolean => {
    if (e.key === 'Backspace' && signatureDivRefCurrent) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return false;
        const range = selection.getRangeAt(0);
        let imageToDelete: HTMLImageElement | null = null;
        if (range.collapsed) {
            const container = range.startContainer;
            const offset = range.startOffset;
            if (container.nodeType === Node.ELEMENT_NODE && offset > 0) {
                const nodeBeforeCursor = container.childNodes[offset - 1];
                if (
                    nodeBeforeCursor &&
                    nodeBeforeCursor.nodeName === 'IMG' &&
                    (nodeBeforeCursor as HTMLImageElement).hasAttribute('data-emoji-src')
                ) {
                    imageToDelete = nodeBeforeCursor as HTMLImageElement;
                }
            } else if (container.nodeType === Node.TEXT_NODE && offset === 0) {
                if (
                    container.previousSibling &&
                    container.previousSibling.nodeName === 'IMG' &&
                    (container.previousSibling as HTMLImageElement).hasAttribute('data-emoji-src')
                ) {
                    imageToDelete = container.previousSibling as HTMLImageElement;
                }
            }
        } else {
            if (
                range.startContainer === range.endContainer &&
                range.endOffset === range.startOffset + 1
            ) {
                const selectedNode = range.startContainer.childNodes[range.startOffset];
                if (
                    selectedNode &&
                    selectedNode.nodeName === 'IMG' &&
                    (selectedNode as HTMLImageElement).hasAttribute('data-emoji-src')
                ) {
                    imageToDelete = selectedNode as HTMLImageElement;
                }
            }
        }
        if (imageToDelete) {
            e.preventDefault();
            imageToDelete.parentNode?.removeChild(imageToDelete);
            const newHtml = signatureDivRefCurrent.innerHTML;
            updateSignatureCallback(newHtml);
            signatureDivRefCurrent.focus();
            return true;
        }
    }
    if (e.type === 'dragstart') {
        e.preventDefault();
        return true;
    }
    return false;
};

export const insertEmojiIntoDiv = (
    emoji: Emoji,
    signatureDivRefCurrent: HTMLDivElement | null,
    updateSignatureCallback: (newHtml: string) => void,
    setLastCursorPosCallback?: (pos: null) => void,
): void => {
    if (signatureDivRefCurrent) {
        signatureDivRefCurrent.focus();
        const emojiImgTag = `<img src="/vipemotions/${emoji.src}.png" alt="${emoji.name}" data-emoji-name="${emoji.name}" data-emoji-src="${emoji.src}" style="width: 17px; height: 17px; vertical-align: middle; margin: 0 1px;" contenteditable="false" draggable="false" />`;
        const selection = window.getSelection();
        if (!selection) return;
        let range: Range;
        if (
            selection.rangeCount > 0 &&
            signatureDivRefCurrent.contains(selection.anchorNode)
        ) {
            range = selection.getRangeAt(0);
            range.deleteContents();
        } else {
            range = document.createRange();
            range.selectNodeContents(signatureDivRefCurrent);
            range.collapse(false);
        }
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = emojiImgTag;
        const imgNodeToInsert = tempDiv.firstChild;
        if (imgNodeToInsert) {
            range.insertNode(imgNodeToInsert);
            range.setStartAfter(imgNodeToInsert);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        updateSignatureCallback(signatureDivRefCurrent.innerHTML);
        if (setLastCursorPosCallback) {
            setLastCursorPosCallback(null);
        }
    }
};

export const handleEmojiSelectionChange = (
    signatureDivRefCurrent: HTMLDivElement | null,
    selectedEmojiImageClass: string,
): void => {
    if (!signatureDivRefCurrent) {
        return;
    }
    const allEmojiImages =
        signatureDivRefCurrent.querySelectorAll<HTMLImageElement>(
            'img[data-emoji-src]',
        );
    allEmojiImages.forEach((img) => {
        img.classList.remove(selectedEmojiImageClass);
    });
    if (document.activeElement !== signatureDivRefCurrent) {
        return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return;
    }
    const range = selection.getRangeAt(0);
    if (!signatureDivRefCurrent.contains(range.commonAncestorContainer)) {
        return;
    }
    allEmojiImages.forEach((img) => {
        if (selection.containsNode(img, true)) {
            img.classList.add(selectedEmojiImageClass);
        }
    });
}; 