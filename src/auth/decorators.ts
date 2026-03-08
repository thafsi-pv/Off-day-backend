import { SetMetadata } from '@nestjs/common';

/** Mark a route as public — AuthGuard will skip it entirely */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);


