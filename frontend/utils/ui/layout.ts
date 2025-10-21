import { ViewStyle } from 'react-native';

export const flexCenter: ViewStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export const flexRow: ViewStyle = {
  display: 'flex',
  flexDirection: 'row',
};

export const flexColumn: ViewStyle = {
  display: 'flex',
  flexDirection: 'column',
};

export const flexBetween: ViewStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

export const flexAround: ViewStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
};

export const flexEvenly: ViewStyle = {
  display: 'flex',
  justifyContent: 'space-evenly',
  alignItems: 'center',
};

export const flexStart: ViewStyle = {
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
};

export const flexEnd: ViewStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'flex-end',
};

export const absoluteFill: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export const absoluteCenter: ViewStyle = {
  ...absoluteFill,
  ...flexCenter,
};

export const createGrid = (columns: number, gap: number): ViewStyle => ({
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginHorizontal: -gap / 2,
});

export const createGridItem = (columns: number, gap: number): ViewStyle => ({
  width: `${100 / columns}%`,
  paddingHorizontal: gap / 2,
  marginBottom: gap,
});

export const createAspectRatio = (ratio: number): ViewStyle => ({
  aspectRatio: ratio,
});

export const createCircle = (size: number): ViewStyle => ({
  width: size,
  height: size,
  borderRadius: size / 2,
});

export const fullWidth: ViewStyle = {
  width: '100%',
};

export const fullHeight: ViewStyle = {
  height: '100%',
};

export const fullSize: ViewStyle = {
  width: '100%',
  height: '100%',
};
