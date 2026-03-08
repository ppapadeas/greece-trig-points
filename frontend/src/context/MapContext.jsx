import { createContext, useContext } from 'react';

const MapContext = createContext(null);

export const MapProvider = MapContext.Provider;

export const useMap = () => {
  const map = useContext(MapContext);
  return map;
};
