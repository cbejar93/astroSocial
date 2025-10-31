import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

type ToolbarItem =
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | { list: "ordered" | "bullet" };

type ToolbarConfig = ToolbarItem[];

type Modules = {
  toolbar?: ToolbarConfig[];
};

type Source = "user" | "api";

type EditorApi = {
  getHTML: () => string;
  getText: () => string;
  focus: () => void;
};

type ChangeHandler = (value: string, delta: undefined, source: Source, editor: EditorApi) => void;

type ReactQuillNewProps = {
  value: string;
  onChange: ChangeHandler;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  modules?: Modules;
  formats?: string[];
  theme?: string;
};

type ImperativeApi = EditorApi & {
  blur: () => void;
};

const DEFAULT_TOOLBAR: ToolbarConfig[] = [
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
];

const sanitizeHtml = (html: string) => {
  if (typeof window === "undefined") return html;
  const container = document.createElement("div");
  container.innerHTML = html;
  container.querySelectorAll("[style]").forEach((el) => {
    const element = el as HTMLElement;
    element.style.removeProperty("color");
    element.style.removeProperty("background-color");
    element.style.removeProperty("background");
  });
  container.querySelectorAll("[color]").forEach((el) => {
    el.removeAttribute("color");
  });
  container.querySelectorAll("[bgcolor]").forEach((el) => {
    el.removeAttribute("bgcolor");
  });
  return container.innerHTML;
};

const commandForItem = (item: ToolbarItem): { command: string; value?: string } | null => {
  if (typeof item === "string") {
    switch (item) {
      case "bold":
        return { command: "bold" };
      case "italic":
        return { command: "italic" };
      case "underline":
        return { command: "underline" };
      case "strike":
        return { command: "strikeThrough" };
      default:
        return null;
    }
  }

  if (item && typeof item === "object" && "list" in item) {
    return {
      command: item.list === "ordered" ? "insertOrderedList" : "insertUnorderedList",
    };
  }

  return null;
};

const labelForItem = (item: ToolbarItem): string => {
  if (typeof item === "string") {
    switch (item) {
      case "bold":
        return "B";
      case "italic":
        return "I";
      case "underline":
        return "U";
      case "strike":
        return "S";
      default:
        return item;
    }
  }

  if (item.list === "ordered") {
    return "1.";
  }

  return "•";
};

const ReactQuillNew = forwardRef<ImperativeApi, ReactQuillNewProps>(
  (
    {
      value,
      onChange,
      className,
      placeholder,
      readOnly = false,
      modules,
    },
    ref,
  ) => {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const toolbarConfig = useMemo(() => modules?.toolbar ?? DEFAULT_TOOLBAR, [modules]);
    const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

    const editorApi = useMemo<EditorApi>(
      () => ({
        getHTML: () => editorRef.current?.innerHTML ?? "",
        getText: () => editorRef.current?.textContent ?? "",
        focus: () => editorRef.current?.focus(),
      }),
      [],
    );

    useImperativeHandle(
      ref,
      () => ({
        ...editorApi,
        blur: () => editorRef.current?.blur(),
      }),
      [editorApi],
    );

    const getItemKey = useCallback((item: ToolbarItem) => {
      if (typeof item === "string") {
        return item;
      }
      return item.list === "ordered" ? "ordered" : "bullet";
    }, []);

    const updateActiveFormats = useCallback(() => {
      if (typeof document === "undefined") return;
      const editorEl = editorRef.current;
      if (!editorEl) return;

      const selection = document.getSelection();
      const anchorNode = selection?.anchorNode ?? null;

      const isWithinEditor = (node: Node | null): boolean => {
        if (!node) return false;
        if (node === editorEl) return true;
        const elementNode = node instanceof Element ? node : node.parentElement;
        return !!elementNode && editorEl.contains(elementNode);
      };

      if (!isWithinEditor(anchorNode)) {
        setActiveFormats((prev) => (Object.keys(prev).length ? {} : prev));
        return;
      }

      const nextState: Record<string, boolean> = {};

      toolbarConfig.forEach((group) => {
        group.forEach((item) => {
          const mapping = commandForItem(item);
          if (!mapping) return;
          const command = mapping.command;
          let isActive = false;
          try {
            isActive = !!document.queryCommandState(command);
          } catch {
            isActive = false;
          }
          nextState[getItemKey(item)] = isActive;
        });
      });

      setActiveFormats((prev) => {
        const keys = new Set([...Object.keys(prev), ...Object.keys(nextState)]);
        let changed = false;
        const merged: Record<string, boolean> = {};
        keys.forEach((key) => {
          const value = nextState[key] ?? false;
          merged[key] = value;
          if (prev[key] !== value) {
            changed = true;
          }
        });
        return changed ? merged : prev;
      });
    }, [getItemKey, toolbarConfig]);

    useEffect(() => {
      if (!editorRef.current) return;
      const sanitized = sanitizeHtml(value);
      if (editorRef.current.innerHTML === sanitized) return;
      editorRef.current.innerHTML = sanitized;
      updateActiveFormats();
    }, [updateActiveFormats, value]);

    useEffect(() => {
      if (!editorRef.current || !placeholder) return;
      const el = editorRef.current;
      const updatePlaceholder = () => {
        if (el.textContent?.trim()) {
          el.dataset.placeholderVisible = "false";
        } else {
          el.dataset.placeholderVisible = "true";
        }
      };

      updatePlaceholder();

      const observer = new MutationObserver(updatePlaceholder);
      observer.observe(el, { childList: true, characterData: true, subtree: true });
      return () => observer.disconnect();
    }, [placeholder]);

    const handleInput = () => {
      if (!editorRef.current) return;
      const currentHtml = editorRef.current.innerHTML;
      const sanitized = sanitizeHtml(currentHtml);
      if (sanitized !== currentHtml) {
        editorRef.current.innerHTML = sanitized;
      }
      onChange(sanitized, undefined, "user", editorApi);
      updateActiveFormats();
    };

    const applyCommand = (item: ToolbarItem) => {
      if (readOnly) return;
      const mapping = commandForItem(item);
      if (!mapping) return;
      editorRef.current?.focus();
      document.execCommand(mapping.command, false, mapping.value ?? "");
      handleInput();
    };

    const toolbarRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!toolbarRef.current) return;
      const preventMouseDown = (event: MouseEvent) => {
        event.preventDefault();
      };
      const toolbarNode = toolbarRef.current;
      toolbarNode.addEventListener("mousedown", preventMouseDown);
      return () => toolbarNode.removeEventListener("mousedown", preventMouseDown);
    }, []);

    useEffect(() => {
      if (typeof document === "undefined") return;
      const editorEl = editorRef.current;
      if (!editorEl) return;

      const handleSelectionChange = () => updateActiveFormats();
      const handleInteraction = () => updateActiveFormats();

      document.addEventListener("selectionchange", handleSelectionChange);
      editorEl.addEventListener("keyup", handleInteraction);
      editorEl.addEventListener("mouseup", handleInteraction);

      updateActiveFormats();

      return () => {
        document.removeEventListener("selectionchange", handleSelectionChange);
        editorEl.removeEventListener("keyup", handleInteraction);
        editorEl.removeEventListener("mouseup", handleInteraction);
      };
    }, [updateActiveFormats]);

    return (
      <div className={`rqn-root ${className ?? ""}`} data-read-only={readOnly ? "true" : "false"}>
        <div className="rqn-toolbar" ref={toolbarRef}>
          {toolbarConfig.map((group, groupIndex) => (
            <div className="rqn-toolbar-group" key={groupIndex}>
              {group.map((item, itemIndex) => {
                const label = labelForItem(item);
                const modifier =
                  typeof item === "string" ? `rqn-${item}` : `rqn-${item.list}`;
                const itemKey = getItemKey(item);
                return (
                  <button
                    key={`${groupIndex}-${itemIndex}`}
                    type="button"
                    className={`rqn-toolbar-button ${modifier}`}
                    onClick={() => applyCommand(item)}
                    aria-label={typeof item === "string" ? item : `${item.list} list`}
                    data-active={activeFormats[itemKey] ? "true" : "false"}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div
          ref={editorRef as MutableRefObject<HTMLDivElement>}
          className="rqn-editor"
          contentEditable={!readOnly}
          data-placeholder={placeholder ?? ""}
          onInput={handleInput}
          onBlur={handleInput}
          suppressContentEditableWarning
        />
      </div>
    );
  },
);

ReactQuillNew.displayName = "ReactQuillNew";

export default ReactQuillNew;
