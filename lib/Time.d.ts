import * as React from 'react';
import PropTypes from 'prop-types';
import { ViewStyle, TextStyle } from 'react-native';
import { LeftRightStyle, IMessage } from './Models';
export interface TimeProps<TMessage extends IMessage> {
    position?: 'left' | 'right';
    currentMessage: TMessage;
    containerStyle?: LeftRightStyle<ViewStyle>;
    timeTextStyle?: LeftRightStyle<TextStyle>;
    timeFormat?: string;
}
export declare function Time<TMessage extends IMessage = IMessage>({ position, containerStyle, currentMessage, timeFormat, timeTextStyle, }: TimeProps<TMessage>): React.JSX.Element | null;
export declare namespace Time {
    var propTypes: {
        position: PropTypes.Requireable<string>;
        currentMessage: PropTypes.Requireable<object>;
        containerStyle: PropTypes.Requireable<PropTypes.InferProps<{
            left: PropTypes.Requireable<NonNullable<number | boolean | object | null | undefined>>;
            right: PropTypes.Requireable<NonNullable<number | boolean | object | null | undefined>>;
        }>>;
        timeFormat: PropTypes.Requireable<string>;
        timeTextStyle: PropTypes.Requireable<PropTypes.InferProps<{
            left: PropTypes.Requireable<NonNullable<number | boolean | object | null | undefined>>;
            right: PropTypes.Requireable<NonNullable<number | boolean | object | null | undefined>>;
        }>>;
    };
}
