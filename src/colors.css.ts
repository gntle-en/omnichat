import { createTheme } from '@vanilla-extract/css';
import { color } from 'folds';
import {
  ayuPalette,
  butterPalette,
  classicPalette,
  darkPalette,
  silverPalette,
} from './themePalettes';

export const silverTheme = createTheme(color, silverPalette);
export const ayuTheme = createTheme(color, ayuPalette);
export const classicTheme = createTheme(color, classicPalette);
export const darkTheme = createTheme(color, darkPalette);
export const butterTheme = createTheme(color, butterPalette);
