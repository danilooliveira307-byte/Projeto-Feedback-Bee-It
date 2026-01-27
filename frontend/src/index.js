import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress the removeChild error caused by Radix UI Portal race condition
// This is a known issue: https://github.com/radix-ui/primitives/issues/3795
const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function(child) {
  if (child.parentNode !== this) {
    console.warn('RemoveChild: node is not a child of this node (suppressed)');
    return child;
  }
  return originalRemoveChild.call(this, child);
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
