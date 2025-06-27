import { useEffect, useState } from 'react';

import { database } from '@/db/database';
import { dictionary } from '@/db/dictionary';

export const useDatabase = () => {
  const [isDBLoadingComplete, setIsDBLoadingComplete] = useState(false);

  useEffect(() => {
    async function loadDataAsync() {
      try {
        await database.initialize();
        await dictionary.initialize();

        setIsDBLoadingComplete(true);
      } catch (e) {
        console.warn(e);
      }
    }

    loadDataAsync();
  }, []);

  return isDBLoadingComplete;
};

export default useDatabase;
