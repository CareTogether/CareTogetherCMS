import { useCallback, useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { reportSubmenuItemsAtom } from '../Model/UI';
import { Report } from 'powerbi-client';

export function useUpdateSideNavigation() {
  const setReportsSubmenuItems = useSetRecoilState(reportSubmenuItemsAtom);

  const updateSideNavigation = async (report: Report) => {
    const pages = await report.getPages();

    const menuItems = pages
      ?.filter((page) => page.visibility === 0) // Filter out hidden pages
      .map((page) => ({
        label: page.displayName,
        isActive: page.isActive,
        onClick: () => {
          report
            ?.setPage(page.name)
            .then(() => {
              updateSideNavigation(report); // This will make sure to get the updated 'isActive' state
            })
            .catch((err) => {
              console.error('Error setting page:', err);
            });
        },
      }));

    if (!menuItems) {
      return;
    }
    setReportsSubmenuItems(menuItems);
  };

  const clearReportsSubmenuItems = useCallback(() => {
    setReportsSubmenuItems([]);
  }, [setReportsSubmenuItems]);

  useEffect(() => {
    return () => {
      clearReportsSubmenuItems();
    }; // Cleanup function to clear submenu items when component unmounts
  }, [clearReportsSubmenuItems]);

  return updateSideNavigation;
}
