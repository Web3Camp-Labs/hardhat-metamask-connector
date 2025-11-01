import { FC } from 'hono/jsx';
import { PageTitleProps } from '../types';

export const PageTitle: FC<PageTitleProps> = ({ network }) => {
    return <span class="title">Running in {network} network</span>;
};
