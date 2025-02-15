import * as React from 'react';
import { StyleSheet, Text, View, } from 'react-native';
import dayjs from 'dayjs';
import Color from './Color';
import { isSameDay } from './utils';
import { DATE_FORMAT } from './Constant';
import { useChatContext } from './GiftedChatContext';
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
        marginBottom: 10,
    },
    text: {
        backgroundColor: Color.backgroundTransparent,
        color: Color.defaultColor,
        fontSize: 12,
        fontWeight: '600',
    },
});
export function Day({ dateFormat = DATE_FORMAT, currentMessage, previousMessage, containerStyle, wrapperStyle, textStyle, }) {
    const { getLocale } = useChatContext();
    if (currentMessage == null || isSameDay(currentMessage, previousMessage))
        return null;
    return (<View style={[styles.container, containerStyle]}>
      <View style={wrapperStyle}>
        <Text style={[styles.text, textStyle]}>
          {dayjs(currentMessage.createdAt)
            .locale(getLocale())
            .format(dateFormat)}
        </Text>
      </View>
    </View>);
}
//# sourceMappingURL=Day.js.map