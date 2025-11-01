import { FC } from 'hono/jsx';
import { ErrorBoxProps } from '../types';

export const ErrorBox: FC<ErrorBoxProps> = ({ id, type = 'error' }) => {
    return <div class={`${type}Box`} id={id}></div>;
};
