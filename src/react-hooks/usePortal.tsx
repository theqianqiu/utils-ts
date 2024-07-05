import { useRef, useEffect, MutableRefObject } from 'react';

/** 创建html节点 */
export function usePortal(id: string | number): HTMLDivElement {
    const rootElemRef: MutableRefObject<HTMLDivElement> = useRef(document.createElement('div'));

    useEffect(() => {
        const currentNode = rootElemRef.current;
        const parentElem: HTMLDivElement | null = document.querySelector(`#${id}`);
        if (parentElem !== null) {
            currentNode.style.width = '100vw';
            currentNode.style.height = '100vh';
            parentElem.appendChild(rootElemRef.current);
        }

        return (): void => {
            currentNode.remove();
        };
    }, [rootElemRef, id]);

    return rootElemRef.current;
}
