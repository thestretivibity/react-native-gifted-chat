import React, { createRef, useEffect, useMemo, useRef, useState, useCallback, } from 'react';
import { ActionSheetProvider, } from '@expo/react-native-action-sheet';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { Platform, StyleSheet, View, } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Actions } from './Actions';
import { Avatar } from './Avatar';
import Bubble from './Bubble';
import { Composer } from './Composer';
import { MAX_COMPOSER_HEIGHT, MIN_COMPOSER_HEIGHT, TEST_ID } from './Constant';
import { Day } from './Day';
import GiftedAvatar from './GiftedAvatar';
import { GiftedChatContext } from './GiftedChatContext';
import { InputToolbar } from './InputToolbar';
import { LoadEarlier } from './LoadEarlier';
import Message from './Message';
import MessageContainer from './MessageContainer';
import { MessageImage } from './MessageImage';
import { MessageText } from './MessageText';
import { Send } from './Send';
import { SystemMessage } from './SystemMessage';
import { Time } from './Time';
import * as utils from './utils';
import Animated, { useAnimatedKeyboard, useAnimatedStyle, useAnimatedReaction, useSharedValue, withTiming, runOnJS, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
dayjs.extend(localizedFormat);
function GiftedChat(props) {
    const { messages = [], initialText = '', isTyping, messageIdGenerator = () => uuidv4(), user = {}, onSend, locale = 'en', renderLoading, actionSheet = null, textInputProps, renderChatFooter = null, renderInputToolbar = null, keyboardShouldPersistTaps = Platform.select({
        ios: 'never',
        android: 'always',
        default: 'never',
    }), onInputTextChanged = null, maxInputLength = null, inverted = true, minComposerHeight = MIN_COMPOSER_HEIGHT, maxComposerHeight = MAX_COMPOSER_HEIGHT, } = props;
    const actionSheetRef = useRef(null);
    const messageContainerRef = useMemo(() => props.messageContainerRef || createRef(), [props.messageContainerRef]);
    const textInputRef = useMemo(() => props.textInputRef || createRef(), [props.textInputRef]);
    const isTextInputWasFocused = useRef(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [composerHeight, setComposerHeight] = useState(minComposerHeight);
    const [text, setText] = useState(() => props.text || '');
    const [isTypingDisabled, setIsTypingDisabled] = useState(false);
    const keyboard = useAnimatedKeyboard();
    const trackingKeyboardMovement = useSharedValue(false);
    const debounceEnableTypingTimeoutId = useRef();
    const insets = useSafeAreaInsets();
    const keyboardOffsetBottom = useSharedValue(0);
    const contentStyleAnim = useAnimatedStyle(() => ({
        transform: [
            { translateY: -keyboard.height.value + keyboardOffsetBottom.value },
        ],
    }), [keyboard, keyboardOffsetBottom]);
    const getTextFromProp = useCallback((fallback) => {
        if (props.text === undefined)
            return fallback;
        return props.text;
    }, [props.text]);
    /**
     * Store text input focus status when keyboard hide to retrieve
     * it afterwards if needed.
     * `onKeyboardWillHide` may be called twice in sequence so we
     * make a guard condition (eg. showing image picker)
     */
    const handleTextInputFocusWhenKeyboardHide = useCallback(() => {
        if (!isTextInputWasFocused.current)
            isTextInputWasFocused.current =
                textInputRef.current?.isFocused() || false;
    }, [textInputRef]);
    /**
     * Refocus the text input only if it was focused before showing keyboard.
     * This is needed in some cases (eg. showing image picker).
     */
    const handleTextInputFocusWhenKeyboardShow = useCallback(() => {
        if (textInputRef.current &&
            isTextInputWasFocused &&
            !textInputRef.current.isFocused())
            textInputRef.current.focus();
        // Reset the indicator since the keyboard is shown
        isTextInputWasFocused.current = false;
    }, [textInputRef]);
    const disableTyping = useCallback(() => {
        clearTimeout(debounceEnableTypingTimeoutId.current);
        setIsTypingDisabled(true);
    }, []);
    const enableTyping = useCallback(() => {
        clearTimeout(debounceEnableTypingTimeoutId.current);
        setIsTypingDisabled(false);
    }, []);
    const debounceEnableTyping = useCallback(() => {
        clearTimeout(debounceEnableTypingTimeoutId.current);
        debounceEnableTypingTimeoutId.current = setTimeout(() => {
            enableTyping();
        }, 50);
    }, [enableTyping]);
    const scrollToBottom = useCallback((isAnimated = true) => {
        if (!messageContainerRef?.current)
            return;
        if (inverted) {
            messageContainerRef.current.scrollToOffset({
                offset: 0,
                animated: isAnimated,
            });
            return;
        }
        messageContainerRef.current.scrollToEnd({ animated: isAnimated });
    }, [inverted, messageContainerRef]);
    const renderMessages = useMemo(() => {
        if (!isInitialized)
            return null;
        const { messagesContainerStyle, ...messagesContainerProps } = props;
        const fragment = (<View style={[styles.fill, messagesContainerStyle]}>
        <MessageContainer {...messagesContainerProps} invertibleScrollViewProps={{
                inverted,
                keyboardShouldPersistTaps,
            }} messages={messages} forwardRef={messageContainerRef} isTyping={isTyping}/>
        {renderChatFooter?.()}
      </View>);
        return fragment;
    }, [
        isInitialized,
        isTyping,
        messages,
        props,
        inverted,
        keyboardShouldPersistTaps,
        messageContainerRef,
        renderChatFooter,
    ]);
    const notifyInputTextReset = useCallback(() => {
        onInputTextChanged?.('');
    }, [onInputTextChanged]);
    const resetInputToolbar = useCallback(() => {
        textInputRef.current?.clear();
        notifyInputTextReset();
        setComposerHeight(minComposerHeight);
        setText(getTextFromProp(''));
        enableTyping();
    }, [
        minComposerHeight,
        getTextFromProp,
        textInputRef,
        notifyInputTextReset,
        enableTyping,
    ]);
    const _onSend = useCallback((messages = [], shouldResetInputToolbar = false) => {
        if (!Array.isArray(messages))
            messages = [messages];
        const newMessages = messages.map(message => {
            return {
                ...message,
                user: user,
                createdAt: new Date(),
                _id: messageIdGenerator?.(),
            };
        });
        if (shouldResetInputToolbar === true) {
            disableTyping();
            resetInputToolbar();
        }
        onSend?.(newMessages);
    }, [messageIdGenerator, onSend, user, resetInputToolbar, disableTyping]);
    const onInputSizeChanged = useCallback((size) => {
        const newComposerHeight = Math.max(minComposerHeight, Math.min(maxComposerHeight, size.height));
        setComposerHeight(newComposerHeight);
    }, [maxComposerHeight, minComposerHeight]);
    const _onInputTextChanged = useCallback((_text) => {
        if (isTypingDisabled)
            return;
        onInputTextChanged?.(_text);
        // Only set state if it's not being overridden by a prop.
        if (props.text === undefined)
            setText(_text);
    }, [onInputTextChanged, isTypingDisabled, props.text]);
    const onInitialLayoutViewLayout = useCallback((e) => {
        const { layout } = e.nativeEvent;
        if (layout.height <= 0)
            return;
        notifyInputTextReset();
        setIsInitialized(true);
        setComposerHeight(minComposerHeight);
        setText(getTextFromProp(initialText));
    }, [initialText, minComposerHeight, notifyInputTextReset, getTextFromProp]);
    const inputToolbarFragment = useMemo(() => {
        if (!isInitialized)
            return null;
        const inputToolbarProps = {
            ...props,
            text: getTextFromProp(text),
            composerHeight: Math.max(minComposerHeight, composerHeight),
            onSend: _onSend,
            onInputSizeChanged,
            onTextChanged: _onInputTextChanged,
            textInputProps: {
                ...textInputProps,
                ref: textInputRef,
                maxLength: isTypingDisabled ? 0 : maxInputLength,
            },
        };
        if (renderInputToolbar)
            return renderInputToolbar(inputToolbarProps);
        return <InputToolbar {...inputToolbarProps}/>;
    }, [
        isInitialized,
        _onSend,
        getTextFromProp,
        maxInputLength,
        minComposerHeight,
        onInputSizeChanged,
        props,
        text,
        renderInputToolbar,
        composerHeight,
        isTypingDisabled,
        textInputRef,
        textInputProps,
        _onInputTextChanged,
    ]);
    const contextValues = useMemo(() => ({
        actionSheet: actionSheet ||
            (() => ({
                showActionSheetWithOptions: actionSheetRef.current.showActionSheetWithOptions,
            })),
        getLocale: () => locale,
    }), [actionSheet, locale]);
    useEffect(() => {
        if (props.text != null)
            setText(props.text);
    }, [props.text]);
    useEffect(() => {
        if (!inverted && messages?.length)
            setTimeout(() => scrollToBottom(false), 200);
    }, [messages?.length, inverted, scrollToBottom]);
    useAnimatedReaction(() => keyboard.height.value, (value, prevValue) => {
        if (prevValue && value !== prevValue) {
            const isKeyboardMovingUp = value > prevValue;
            if (isKeyboardMovingUp !== trackingKeyboardMovement.value) {
                trackingKeyboardMovement.value = isKeyboardMovingUp;
                keyboardOffsetBottom.value = withTiming(isKeyboardMovingUp ? insets.bottom : 0, {
                    duration: 400,
                });
                if (isKeyboardMovingUp)
                    runOnJS(handleTextInputFocusWhenKeyboardShow)();
                else
                    runOnJS(handleTextInputFocusWhenKeyboardHide)();
                if (value === 0) {
                    runOnJS(enableTyping)();
                }
                else {
                    runOnJS(disableTyping)();
                    runOnJS(debounceEnableTyping)();
                }
            }
        }
    }, [
        keyboard,
        trackingKeyboardMovement,
        insets,
        handleTextInputFocusWhenKeyboardHide,
        handleTextInputFocusWhenKeyboardShow,
        enableTyping,
        disableTyping,
        debounceEnableTyping,
    ]);
    return (<GiftedChatContext.Provider value={contextValues}>
      <ActionSheetProvider ref={actionSheetRef}>
        <View testID={TEST_ID.WRAPPER} style={[styles.fill, styles.contentContainer]} onLayout={onInitialLayoutViewLayout}>
          {isInitialized
            ? (<Animated.View style={[styles.fill, contentStyleAnim]}>
                {renderMessages}
                {inputToolbarFragment}
              </Animated.View>)
            : (renderLoading?.())}
        </View>
      </ActionSheetProvider>
    </GiftedChatContext.Provider>);
}
GiftedChat.append = (currentMessages = [], messages, inverted = true) => {
    if (!Array.isArray(messages))
        messages = [messages];
    return inverted
        ? messages.concat(currentMessages)
        : currentMessages.concat(messages);
};
GiftedChat.prepend = (currentMessages = [], messages, inverted = true) => {
    if (!Array.isArray(messages))
        messages = [messages];
    return inverted
        ? currentMessages.concat(messages)
        : messages.concat(currentMessages);
};
const styles = StyleSheet.create({
    fill: {
        flex: 1,
    },
    contentContainer: {
        overflow: 'hidden',
    },
});
export * from './Models';
export { GiftedChat, Actions, Avatar, Bubble, SystemMessage, MessageImage, MessageText, Composer, Day, InputToolbar, LoadEarlier, Message, MessageContainer, Send, Time, GiftedAvatar, utils };
//# sourceMappingURL=GiftedChat.js.map