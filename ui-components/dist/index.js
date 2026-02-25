import { c as Au, g as _n, r as So, s as ou, i as w0, a as Se, P as a, b as E0, d as iu, e as su, f as yo } from "./theme-BwQjBHAN.js";
import { t as tx } from "./theme-BwQjBHAN.js";
import { jsx as S, jsxs as fe, Fragment as S0 } from "react/jsx-runtime";
import { AppBar as T0, Toolbar as C0, Box as ee, Card as ko, useTheme as Qt, useMediaQuery as jt, Container as R0, Breadcrumbs as I0, Link as O0, Typography as Be, Menu as P0, MenuItem as M0, Tabs as A0, alpha as Nu, Chip as N0, styled as Lu, StepConnector as Du, stepConnectorClasses as Ln, Stepper as ku, Step as Bu, StepButton as L0, StepLabel as Fu, Accordion as D0, AccordionSummary as k0, AccordionDetails as B0, Divider as F0, Tooltip as $0, StepContent as z0, Popover as W0, Button as U0 } from "@mui/material";
import * as C from "react";
import nt, { createContext as $u, useContext as zu, useMemo as H0, useState as Jt, useCallback as _o, isValidElement as wo, cloneElement as wr, Children as V0, useId as Wu } from "react";
import G0 from "@emotion/styled";
import { ThemeContext as K0, keyframes as Tr, css as Uu } from "@emotion/react";
import * as q0 from "react-dom";
import bo from "react-dom";
const Hu = "$$material";
function Y0(r) {
  for (var i = 0, o, l = 0, f = r.length; f >= 4; ++l, f -= 4)
    o = r.charCodeAt(l) & 255 | (r.charCodeAt(++l) & 255) << 8 | (r.charCodeAt(++l) & 255) << 16 | (r.charCodeAt(++l) & 255) << 24, o = /* Math.imul(k, m): */
    (o & 65535) * 1540483477 + ((o >>> 16) * 59797 << 16), o ^= /* k >>> r: */
    o >>> 24, i = /* Math.imul(k, m): */
    (o & 65535) * 1540483477 + ((o >>> 16) * 59797 << 16) ^ /* Math.imul(h, m): */
    (i & 65535) * 1540483477 + ((i >>> 16) * 59797 << 16);
  switch (f) {
    case 3:
      i ^= (r.charCodeAt(l + 2) & 255) << 16;
    case 2:
      i ^= (r.charCodeAt(l + 1) & 255) << 8;
    case 1:
      i ^= r.charCodeAt(l) & 255, i = /* Math.imul(h, m): */
      (i & 65535) * 1540483477 + ((i >>> 16) * 59797 << 16);
  }
  return i ^= i >>> 13, i = /* Math.imul(h, m): */
  (i & 65535) * 1540483477 + ((i >>> 16) * 59797 << 16), ((i ^ i >>> 15) >>> 0).toString(36);
}
var X0 = {
  animationIterationCount: 1,
  aspectRatio: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  scale: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
};
function Z0(r) {
  var i = /* @__PURE__ */ Object.create(null);
  return function(o) {
    return i[o] === void 0 && (i[o] = r(o)), i[o];
  };
}
var j0 = /[A-Z]|^ms/g, J0 = /_EMO_([^_]+?)_([^]*?)_EMO_/g, Vu = function(i) {
  return i.charCodeAt(1) === 45;
}, au = function(i) {
  return i != null && typeof i != "boolean";
}, as = /* @__PURE__ */ Z0(function(r) {
  return Vu(r) ? r : r.replace(j0, "-$&").toLowerCase();
}), lu = function(i, o) {
  switch (i) {
    case "animation":
    case "animationName":
      if (typeof o == "string")
        return o.replace(J0, function(l, f, c) {
          return pt = {
            name: f,
            styles: c,
            next: pt
          }, f;
        });
  }
  return X0[i] !== 1 && !Vu(i) && typeof o == "number" && o !== 0 ? o + "px" : o;
};
function To(r, i, o) {
  if (o == null)
    return "";
  var l = o;
  if (l.__emotion_styles !== void 0)
    return l;
  switch (typeof o) {
    case "boolean":
      return "";
    case "object": {
      var f = o;
      if (f.anim === 1)
        return pt = {
          name: f.name,
          styles: f.styles,
          next: pt
        }, f.name;
      var c = o;
      if (c.styles !== void 0) {
        var h = c.next;
        if (h !== void 0)
          for (; h !== void 0; )
            pt = {
              name: h.name,
              styles: h.styles,
              next: pt
            }, h = h.next;
        var g = c.styles + ";";
        return g;
      }
      return Q0(r, i, o);
    }
  }
  var y = o;
  return y;
}
function Q0(r, i, o) {
  var l = "";
  if (Array.isArray(o))
    for (var f = 0; f < o.length; f++)
      l += To(r, i, o[f]) + ";";
  else
    for (var c in o) {
      var h = o[c];
      if (typeof h != "object") {
        var g = h;
        au(g) && (l += as(c) + ":" + lu(c, g) + ";");
      } else if (Array.isArray(h) && typeof h[0] == "string" && i == null)
        for (var y = 0; y < h.length; y++)
          au(h[y]) && (l += as(c) + ":" + lu(c, h[y]) + ";");
      else {
        var b = To(r, i, h);
        switch (c) {
          case "animation":
          case "animationName": {
            l += as(c) + ":" + b + ";";
            break;
          }
          default:
            l += c + "{" + b + "}";
        }
      }
    }
  return l;
}
var uu = /label:\s*([^\s;{]+)\s*(;|$)/g, pt;
function ey(r, i, o) {
  if (r.length === 1 && typeof r[0] == "object" && r[0] !== null && r[0].styles !== void 0)
    return r[0];
  var l = !0, f = "";
  pt = void 0;
  var c = r[0];
  if (c == null || c.raw === void 0)
    l = !1, f += To(o, i, c);
  else {
    var h = c;
    f += h[0];
  }
  for (var g = 1; g < r.length; g++)
    if (f += To(o, i, r[g]), l) {
      var y = c;
      f += y[g];
    }
  uu.lastIndex = 0;
  for (var b = "", E; (E = uu.exec(f)) !== null; )
    b += "-" + E[1];
  var R = Y0(f) + b;
  return {
    name: R,
    styles: f,
    next: pt
  };
}
function ny(r, i) {
  const o = G0(r, i);
  return process.env.NODE_ENV !== "production" ? (...l) => {
    const f = typeof r == "string" ? `"${r}"` : "component";
    return l.length === 0 ? console.error([`MUI: Seems like you called \`styled(${f})()\` without a \`style\` argument.`, 'You must provide a `styles` argument: `styled("div")(styleYouForgotToPass)`.'].join(`
`)) : l.some((c) => c === void 0) && console.error(`MUI: the styled(${f})(...args) API requires all its args to be defined.`), o(...l);
  } : o;
}
function ty(r, i) {
  Array.isArray(r.__emotion_styles) && (r.__emotion_styles = i(r.__emotion_styles));
}
const cu = [];
function Ot(r) {
  return cu[0] = r, ey(cu);
}
function ry(r) {
  return Object.keys(r).length === 0;
}
function oy(r = null) {
  const i = C.useContext(K0);
  return !i || ry(i) ? r : i;
}
const iy = Au();
function sy(r = iy) {
  return oy(r);
}
function Gu(r) {
  var i, o, l = "";
  if (typeof r == "string" || typeof r == "number") l += r;
  else if (typeof r == "object") if (Array.isArray(r)) {
    var f = r.length;
    for (i = 0; i < f; i++) r[i] && (o = Gu(r[i])) && (l && (l += " "), l += o);
  } else for (o in r) r[o] && (l && (l += " "), l += o);
  return l;
}
function Te() {
  for (var r, i, o = 0, l = "", f = arguments.length; o < f; o++) (r = arguments[o]) && (i = Gu(r)) && (l && (l += " "), l += i);
  return l;
}
function wn(r, i, o = "Mui") {
  const l = {};
  return i.forEach((f) => {
    l[f] = _n(r, f, o);
  }), l;
}
function Ku(r, i = "") {
  return r.displayName || r.name || i;
}
function fu(r, i, o) {
  const l = Ku(i);
  return r.displayName || (l !== "" ? `${o}(${l})` : o);
}
function ay(r) {
  if (r != null) {
    if (typeof r == "string")
      return r;
    if (typeof r == "function")
      return Ku(r, "Component");
    if (typeof r == "object")
      switch (r.$$typeof) {
        case So.ForwardRef:
          return fu(r, r.render, "ForwardRef");
        case So.Memo:
          return fu(r, r.type, "memo");
        default:
          return;
      }
  }
}
function qu(r) {
  const {
    variants: i,
    ...o
  } = r, l = {
    variants: i,
    style: Ot(o),
    isProcessed: !0
  };
  return l.style === o || i && i.forEach((f) => {
    typeof f.style != "function" && (f.style = Ot(f.style));
  }), l;
}
const ly = Au();
function ls(r) {
  return r !== "ownerState" && r !== "theme" && r !== "sx" && r !== "as";
}
function Rt(r, i) {
  return i && r && typeof r == "object" && r.styles && !r.styles.startsWith("@layer") && (r.styles = `@layer ${i}{${String(r.styles)}}`), r;
}
function uy(r) {
  return r ? (i, o) => o[r] : null;
}
function cy(r, i, o) {
  r.theme = hy(r.theme) ? o : r.theme[i] || r.theme;
}
function Eo(r, i, o) {
  const l = typeof i == "function" ? i(r) : i;
  if (Array.isArray(l))
    return l.flatMap((f) => Eo(r, f, o));
  if (Array.isArray(l?.variants)) {
    let f;
    if (l.isProcessed)
      f = o ? Rt(l.style, o) : l.style;
    else {
      const {
        variants: c,
        ...h
      } = l;
      f = o ? Rt(Ot(h), o) : h;
    }
    return Yu(r, l.variants, [f], o);
  }
  return l?.isProcessed ? o ? Rt(Ot(l.style), o) : l.style : o ? Rt(Ot(l), o) : l;
}
function Yu(r, i, o = [], l = void 0) {
  let f;
  e: for (let c = 0; c < i.length; c += 1) {
    const h = i[c];
    if (typeof h.props == "function") {
      if (f ??= {
        ...r,
        ...r.ownerState,
        ownerState: r.ownerState
      }, !h.props(f))
        continue;
    } else
      for (const g in h.props)
        if (r[g] !== h.props[g] && r.ownerState?.[g] !== h.props[g])
          continue e;
    typeof h.style == "function" ? (f ??= {
      ...r,
      ...r.ownerState,
      ownerState: r.ownerState
    }, o.push(l ? Rt(Ot(h.style(f)), l) : h.style(f))) : o.push(l ? Rt(Ot(h.style), l) : h.style);
  }
  return o;
}
function fy(r = {}) {
  const {
    themeId: i,
    defaultTheme: o = ly,
    rootShouldForwardProp: l = ls,
    slotShouldForwardProp: f = ls
  } = r;
  function c(g) {
    cy(g, i, o);
  }
  return (g, y = {}) => {
    ty(g, (q) => q.filter((W) => W !== ou));
    const {
      name: b,
      slot: E,
      skipVariantsResolver: R,
      skipSx: N,
      // TODO v6: remove `lowercaseFirstLetter()` in the next major release
      // For more details: https://github.com/mui/material-ui/pull/37908
      overridesResolver: M = uy(Xu(E)),
      ...A
    } = y, k = b && b.startsWith("Mui") || E ? "components" : "custom", z = R !== void 0 ? R : (
      // TODO v6: remove `Root` in the next major release
      // For more details: https://github.com/mui/material-ui/pull/37908
      E && E !== "Root" && E !== "root" || !1
    ), B = N || !1;
    let H = ls;
    E === "Root" || E === "root" ? H = l : E ? H = f : gy(g) && (H = void 0);
    const L = ny(g, {
      shouldForwardProp: H,
      label: py(b, E),
      ...A
    }), D = (q) => {
      if (q.__emotion_real === q)
        return q;
      if (typeof q == "function")
        return function(G) {
          return Eo(G, q, G.theme.modularCssLayers ? k : void 0);
        };
      if (w0(q)) {
        const W = qu(q);
        return function(Z) {
          return W.variants ? Eo(Z, W, Z.theme.modularCssLayers ? k : void 0) : Z.theme.modularCssLayers ? Rt(W.style, k) : W.style;
        };
      }
      return q;
    }, U = (...q) => {
      const W = [], G = q.map(D), Z = [];
      if (W.push(c), b && M && Z.push(function(re) {
        const $ = re.theme.components?.[b]?.styleOverrides;
        if (!$)
          return null;
        const K = {};
        for (const le in $)
          K[le] = Eo(re, $[le], re.theme.modularCssLayers ? "theme" : void 0);
        return M(re, K);
      }), b && !z && Z.push(function(re) {
        const $ = re.theme?.components?.[b]?.variants;
        return $ ? Yu(re, $, [], re.theme.modularCssLayers ? "theme" : void 0) : null;
      }), B || Z.push(ou), Array.isArray(G[0])) {
        const se = G.shift(), re = new Array(W.length).fill(""), te = new Array(Z.length).fill("");
        let $;
        $ = [...re, ...se, ...te], $.raw = [...re, ...se.raw, ...te], W.unshift($);
      }
      const ge = [...W, ...G, ...Z], de = L(...ge);
      return g.muiName && (de.muiName = g.muiName), process.env.NODE_ENV !== "production" && (de.displayName = dy(b, E, g)), de;
    };
    return L.withConfig && (U.withConfig = L.withConfig), U;
  };
}
function dy(r, i, o) {
  return r ? `${r}${Se(i || "")}` : `Styled(${ay(o)})`;
}
function py(r, i) {
  let o;
  return process.env.NODE_ENV !== "production" && r && (o = `${r}-${Xu(i || "Root")}`), o;
}
function hy(r) {
  for (const i in r)
    return !1;
  return !0;
}
function gy(r) {
  return typeof r == "string" && // 96 is one less than the char code
  // for "a" so this is checking that
  // it's a lowercase character
  r.charCodeAt(0) > 96;
}
function Xu(r) {
  return r && r.charAt(0).toLowerCase() + r.slice(1);
}
function Co(r, i, o = !1) {
  const l = {
    ...i
  };
  for (const f in r)
    if (Object.prototype.hasOwnProperty.call(r, f)) {
      const c = f;
      if (c === "components" || c === "slots")
        l[c] = {
          ...r[c],
          ...l[c]
        };
      else if (c === "componentsProps" || c === "slotProps") {
        const h = r[c], g = i[c];
        if (!g)
          l[c] = h || {};
        else if (!h)
          l[c] = g;
        else {
          l[c] = {
            ...g
          };
          for (const y in h)
            if (Object.prototype.hasOwnProperty.call(h, y)) {
              const b = y;
              l[c][b] = Co(h[b], g[b], o);
            }
        }
      } else c === "className" && o && i.className ? l.className = Te(r?.className, i?.className) : c === "style" && o && i.style ? l.style = {
        ...r?.style,
        ...i?.style
      } : l[c] === void 0 && (l[c] = r[c]);
    }
  return l;
}
const Ro = typeof window < "u" ? C.useLayoutEffect : C.useEffect, my = "exact-prop: ​";
function Zu(r) {
  return process.env.NODE_ENV === "production" ? r : {
    ...r,
    [my]: (i) => {
      const o = Object.keys(i).filter((l) => !r.hasOwnProperty(l));
      return o.length > 0 ? new Error(`The following props are not supported: ${o.map((l) => `\`${l}\``).join(", ")}. Please remove them.`) : null;
    }
  };
}
const vy = /* @__PURE__ */ C.createContext();
process.env.NODE_ENV !== "production" && (a.node, a.bool);
const yy = () => C.useContext(vy) ?? !1, by = /* @__PURE__ */ C.createContext(void 0);
process.env.NODE_ENV !== "production" && (a.node, a.object);
function xy(r) {
  const {
    theme: i,
    name: o,
    props: l
  } = r;
  if (!i || !i.components || !i.components[o])
    return l;
  const f = i.components[o];
  return f.defaultProps ? Co(f.defaultProps, l, i.components.mergeClassNameAndStyle) : !f.styleOverrides && !f.variants ? Co(f, l, i.components.mergeClassNameAndStyle) : l;
}
function _y({
  props: r,
  name: i
}) {
  const o = C.useContext(by);
  return xy({
    props: r,
    name: i,
    theme: {
      components: o
    }
  });
}
let du = 0;
function wy(r) {
  const [i, o] = C.useState(r), l = r || i;
  return C.useEffect(() => {
    i == null && (du += 1, o(`mui-${du}`));
  }, [i]), l;
}
const Ey = {
  ...C
}, pu = Ey.useId;
function ju(r) {
  if (pu !== void 0) {
    const i = pu();
    return r ?? i;
  }
  return wy(r);
}
const hu = {
  theme: void 0
};
function Sy(r) {
  let i, o;
  return function(f) {
    let c = i;
    return (c === void 0 || f.theme !== o) && (hu.theme = f.theme, c = qu(r(hu)), i = c, o = f.theme), c;
  };
}
function Dn(r, i, o = void 0) {
  const l = {};
  for (const f in r) {
    const c = r[f];
    let h = "", g = !0;
    for (let y = 0; y < c.length; y += 1) {
      const b = c[y];
      b && (h += (g === !0 ? "" : " ") + i(b), g = !1, o && o[b] && (h += " " + o[b]));
    }
    l[f] = h;
  }
  return l;
}
const Ju = E0();
function Cr() {
  const r = sy(Ju);
  return process.env.NODE_ENV !== "production" && C.useDebugValue(r), r[Hu] || r;
}
function Ty(r) {
  return r !== "ownerState" && r !== "theme" && r !== "sx" && r !== "as";
}
const xs = (r) => Ty(r) && r !== "classes", Pe = fy({
  themeId: Hu,
  defaultTheme: Ju,
  rootShouldForwardProp: xs
}), Cy = ({
  leftContent: r,
  centerContent: i,
  rightContent: o,
  position: l = "fixed",
  elevation: f = 3,
  color: c = "transparent",
  sx: h
}) => /* @__PURE__ */ S(
  T0,
  {
    position: l,
    elevation: f,
    color: c,
    sx: {
      bgcolor: "background.paper",
      ...h
    },
    children: /* @__PURE__ */ fe(
      C0,
      {
        sx: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        },
        children: [
          r && /* @__PURE__ */ S(ee, { sx: { display: "flex", alignItems: "center", flexShrink: 0 }, children: r }),
          i && /* @__PURE__ */ S(
            ee,
            {
              sx: {
                display: "flex",
                alignItems: "center",
                flexGrow: 1,
                justifyContent: "center",
                overflow: "hidden"
              },
              children: i
            }
          ),
          o && /* @__PURE__ */ S(ee, { sx: { display: "flex", alignItems: "center", flexShrink: 0, gap: 1 }, children: o })
        ]
      }
    )
  }
), Qu = $u(null), Ry = () => zu(Qu), Iy = ({
  open: r = !0,
  expandedWidth: i = 236,
  collapsedWidth: o = 88,
  children: l,
  sx: f
}) => {
  const c = Ry(), h = c?.sidebarOpen ?? r, g = c?.sidebarExpandedWidth ?? i, y = c?.sidebarCollapsedWidth ?? o, b = c?.headerHeight ?? 64;
  return /* @__PURE__ */ S(
    ee,
    {
      component: "nav",
      sx: {
        backgroundColor: "background.paper",
        width: h ? g : y,
        transition: "width 0.2s ease-in-out",
        overflow: "auto",
        borderRight: 1,
        borderColor: "divider",
        // When in Shell, apply fixed positioning
        ...c !== null && {
          position: "fixed",
          top: b,
          left: 0,
          height: `calc(100vh - ${b}px)`
        },
        ...f
      },
      children: l
    }
  );
}, Oy = ({
  children: r,
  marginLeft: i,
  marginTop: o,
  marginBottom: l,
  component: f = "main",
  sx: c
}) => /* @__PURE__ */ S(
  ee,
  {
    component: f,
    sx: {
      flexGrow: 1,
      marginLeft: i,
      marginTop: o,
      marginBottom: l,
      ...c
    },
    children: r
  }
), Py = ({ children: r, component: i = "footer", sx: o }) => /* @__PURE__ */ S(
  ko,
  {
    component: i,
    elevation: 2,
    sx: {
      mt: "auto",
      borderRadius: 0,
      flexShrink: 0,
      ...o
    },
    children: r
  }
), Bo = ({
  sx: r,
  sidebarOpen: i = !0,
  sidebarExpandedWidth: o = 236,
  sidebarCollapsedWidth: l = 88,
  hideSidebarBelow: f,
  header: c,
  sidebar: h,
  content: g,
  footer: y
}) => {
  const b = Qt(), E = jt(
    f ? b.breakpoints.down(f) : "(min-width: 0px)"
  ), N = (f ? E : !1) ? null : h, M = N ? i ? o : l : 0, k = b.mixins.toolbar.minHeight || 64, z = H0(
    () => ({
      headerHeight: k,
      sidebarWidth: M,
      sidebarOpen: i,
      sidebarExpandedWidth: o,
      sidebarCollapsedWidth: l
    }),
    [k, M, i, o, l]
  );
  return /* @__PURE__ */ S(Qu.Provider, { value: z, children: /* @__PURE__ */ fe(
    ee,
    {
      sx: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        ...r
      },
      children: [
        c,
        N,
        /* @__PURE__ */ fe(
          ee,
          {
            sx: {
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "auto",
              marginTop: `${k}px`,
              marginLeft: `${M}px`,
              transition: "margin-left 0.2s ease-in-out"
            },
            children: [
              g,
              y
            ]
          }
        )
      ]
    }
  ) });
};
Bo.Header = Cy;
Bo.Sidebar = Iy;
Bo.Content = Oy;
Bo.Footer = Py;
function gu(...r) {
  return r.reduce((i, o) => o == null ? i : function(...f) {
    i.apply(this, f), o.apply(this, f);
  }, () => {
  });
}
const rt = Sy;
process.env.NODE_ENV !== "production" && (a.node, a.object.isRequired);
function En(r) {
  return _y(r);
}
function My(r) {
  return _n("MuiSvgIcon", r);
}
wn("MuiSvgIcon", ["root", "colorPrimary", "colorSecondary", "colorAction", "colorError", "colorDisabled", "fontSizeInherit", "fontSizeSmall", "fontSizeMedium", "fontSizeLarge"]);
const Ay = (r) => {
  const {
    color: i,
    fontSize: o,
    classes: l
  } = r, f = {
    root: ["root", i !== "inherit" && `color${Se(i)}`, `fontSize${Se(o)}`]
  };
  return Dn(f, My, l);
}, Ny = Pe("svg", {
  name: "MuiSvgIcon",
  slot: "Root",
  overridesResolver: (r, i) => {
    const {
      ownerState: o
    } = r;
    return [i.root, o.color !== "inherit" && i[`color${Se(o.color)}`], i[`fontSize${Se(o.fontSize)}`]];
  }
})(rt(({
  theme: r
}) => ({
  userSelect: "none",
  width: "1em",
  height: "1em",
  display: "inline-block",
  flexShrink: 0,
  transition: r.transitions?.create?.("fill", {
    duration: (r.vars ?? r).transitions?.duration?.shorter
  }),
  variants: [
    {
      props: (i) => !i.hasSvgAsChild,
      style: {
        // the <svg> will define the property that has `currentColor`
        // for example heroicons uses fill="none" and stroke="currentColor"
        fill: "currentColor"
      }
    },
    {
      props: {
        fontSize: "inherit"
      },
      style: {
        fontSize: "inherit"
      }
    },
    {
      props: {
        fontSize: "small"
      },
      style: {
        fontSize: r.typography?.pxToRem?.(20) || "1.25rem"
      }
    },
    {
      props: {
        fontSize: "medium"
      },
      style: {
        fontSize: r.typography?.pxToRem?.(24) || "1.5rem"
      }
    },
    {
      props: {
        fontSize: "large"
      },
      style: {
        fontSize: r.typography?.pxToRem?.(35) || "2.1875rem"
      }
    },
    // TODO v5 deprecate color prop, v6 remove for sx
    ...Object.entries((r.vars ?? r).palette).filter(([, i]) => i && i.main).map(([i]) => ({
      props: {
        color: i
      },
      style: {
        color: (r.vars ?? r).palette?.[i]?.main
      }
    })),
    {
      props: {
        color: "action"
      },
      style: {
        color: (r.vars ?? r).palette?.action?.active
      }
    },
    {
      props: {
        color: "disabled"
      },
      style: {
        color: (r.vars ?? r).palette?.action?.disabled
      }
    },
    {
      props: {
        color: "inherit"
      },
      style: {
        color: void 0
      }
    }
  ]
}))), Io = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const l = En({
    props: i,
    name: "MuiSvgIcon"
  }), {
    children: f,
    className: c,
    color: h = "inherit",
    component: g = "svg",
    fontSize: y = "medium",
    htmlColor: b,
    inheritViewBox: E = !1,
    titleAccess: R,
    viewBox: N = "0 0 24 24",
    ...M
  } = l, A = /* @__PURE__ */ C.isValidElement(f) && f.type === "svg", k = {
    ...l,
    color: h,
    component: g,
    fontSize: y,
    instanceFontSize: i.fontSize,
    inheritViewBox: E,
    viewBox: N,
    hasSvgAsChild: A
  }, z = {};
  E || (z.viewBox = N);
  const B = Ay(k);
  return /* @__PURE__ */ fe(Ny, {
    as: g,
    className: Te(B.root, c),
    focusable: "false",
    color: b,
    "aria-hidden": R ? void 0 : !0,
    role: R ? "img" : void 0,
    ref: o,
    ...z,
    ...M,
    ...A && f.props,
    ownerState: k,
    children: [A ? f.props.children : f, R ? /* @__PURE__ */ S("title", {
      children: R
    }) : null]
  });
});
process.env.NODE_ENV !== "production" && (Io.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Node passed into the SVG element.
   */
  children: a.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: a.object,
  /**
   * @ignore
   */
  className: a.string,
  /**
   * The color of the component.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   * You can use the `htmlColor` prop to apply a color attribute to the SVG element.
   * @default 'inherit'
   */
  color: a.oneOfType([a.oneOf(["inherit", "action", "disabled", "primary", "secondary", "error", "info", "success", "warning"]), a.string]),
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: a.elementType,
  /**
   * The fontSize applied to the icon. Defaults to 24px, but can be configure to inherit font size.
   * @default 'medium'
   */
  fontSize: a.oneOfType([a.oneOf(["inherit", "large", "medium", "small"]), a.string]),
  /**
   * Applies a color attribute to the SVG element.
   */
  htmlColor: a.string,
  /**
   * If `true`, the root node will inherit the custom `component`'s viewBox and the `viewBox`
   * prop will be ignored.
   * Useful when you want to reference a custom `component` and have `SvgIcon` pass that
   * `component`'s viewBox to the root node.
   * @default false
   */
  inheritViewBox: a.bool,
  /**
   * The shape-rendering attribute. The behavior of the different options is described on the
   * [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/shape-rendering).
   * If you are having issues with blurry icons you should investigate this prop.
   */
  shapeRendering: a.string,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: a.oneOfType([a.arrayOf(a.oneOfType([a.func, a.object, a.bool])), a.func, a.object]),
  /**
   * Provides a human-readable title for the element that contains it.
   * https://www.w3.org/TR/SVG-access/#Equivalent
   */
  titleAccess: a.string,
  /**
   * Allows you to redefine what the coordinates without units mean inside an SVG element.
   * For example, if the SVG element is 500 (width) by 200 (height),
   * and you pass viewBox="0 0 50 20",
   * this means that the coordinates inside the SVG will go from the top left corner (0,0)
   * to bottom right (50,20) and each unit will be worth 10px.
   * @default '0 0 24 24'
   */
  viewBox: a.string
});
Io.muiName = "SvgIcon";
function _s(r, i) {
  function o(l, f) {
    return /* @__PURE__ */ S(Io, {
      "data-testid": process.env.NODE_ENV !== "production" ? `${i}Icon` : void 0,
      ref: f,
      ...l,
      children: r
    });
  }
  return process.env.NODE_ENV !== "production" && (o.displayName = `${i}Icon`), o.muiName = Io.muiName, /* @__PURE__ */ C.memo(/* @__PURE__ */ C.forwardRef(o));
}
function Ly(r, i = 166) {
  let o;
  function l(...f) {
    const c = () => {
      r.apply(this, f);
    };
    clearTimeout(o), o = setTimeout(c, i);
  }
  return l.clear = () => {
    clearTimeout(o);
  }, l;
}
function zn(r) {
  return r && r.ownerDocument || document;
}
function Pt(r) {
  return zn(r).defaultView || window;
}
function mu(r, i) {
  typeof r == "function" ? r(i) : r && (r.current = i);
}
function Zt(r) {
  const i = C.useRef(r);
  return Ro(() => {
    i.current = r;
  }), C.useRef((...o) => (
    // @ts-expect-error hide `this`
    (0, i.current)(...o)
  )).current;
}
function Wn(...r) {
  const i = C.useRef(void 0), o = C.useCallback((l) => {
    const f = r.map((c) => {
      if (c == null)
        return null;
      if (typeof c == "function") {
        const h = c, g = h(l);
        return typeof g == "function" ? g : () => {
          h(null);
        };
      }
      return c.current = l, () => {
        c.current = null;
      };
    });
    return () => {
      f.forEach((c) => c?.());
    };
  }, r);
  return C.useMemo(() => r.every((l) => l == null) ? null : (l) => {
    i.current && (i.current(), i.current = void 0), l != null && (i.current = o(l));
  }, r);
}
function Dy(r, i) {
  const o = r.charCodeAt(2);
  return r[0] === "o" && r[1] === "n" && o >= 65 && o <= 90 && typeof i == "function";
}
function ky(r, i) {
  if (!r)
    return i;
  function o(h, g) {
    const y = {};
    return Object.keys(g).forEach((b) => {
      Dy(b, g[b]) && typeof h[b] == "function" && (y[b] = (...E) => {
        h[b](...E), g[b](...E);
      });
    }), y;
  }
  if (typeof r == "function" || typeof i == "function")
    return (h) => {
      const g = typeof i == "function" ? i(h) : i, y = typeof r == "function" ? r({
        ...h,
        ...g
      }) : r, b = Te(h?.className, g?.className, y?.className), E = o(y, g);
      return {
        ...g,
        ...y,
        ...E,
        ...!!b && {
          className: b
        },
        ...g?.style && y?.style && {
          style: {
            ...g.style,
            ...y.style
          }
        },
        ...g?.sx && y?.sx && {
          sx: [...Array.isArray(g.sx) ? g.sx : [g.sx], ...Array.isArray(y.sx) ? y.sx : [y.sx]]
        }
      };
    };
  const l = i, f = o(r, l), c = Te(l?.className, r?.className);
  return {
    ...i,
    ...r,
    ...f,
    ...!!c && {
      className: c
    },
    ...l?.style && r?.style && {
      style: {
        ...l.style,
        ...r.style
      }
    },
    ...l?.sx && r?.sx && {
      sx: [...Array.isArray(l.sx) ? l.sx : [l.sx], ...Array.isArray(r.sx) ? r.sx : [r.sx]]
    }
  };
}
const ec = _s(/* @__PURE__ */ S("path", {
  d: "M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"
}), "ExpandMore"), Fo = ({
  children: r,
  sx: i,
  className: o,
  maxWidth: l = "lg",
  disableGutters: f = !1
}) => l === !1 ? /* @__PURE__ */ S(ee, { className: o, sx: i, children: r }) : /* @__PURE__ */ S(R0, { maxWidth: l, disableGutters: f, className: o, sx: i, children: r }), By = ({
  items: r,
  rightContent: i,
  sx: o,
  className: l
}) => {
  const f = Qt(), c = jt(f.breakpoints.down("sm"));
  return /* @__PURE__ */ fe(
    ee,
    {
      sx: {
        display: "flex",
        flexDirection: c && i ? "column" : "row",
        justifyContent: "space-between",
        alignItems: c && i ? "flex-start" : "center",
        gap: c && i ? 1.5 : 0,
        my: 2.5
      },
      children: [
        /* @__PURE__ */ S(I0, { className: l, sx: { minWidth: 0, ...o }, children: r.map(
          (h, g) => h.href || h.onClick ? /* @__PURE__ */ S(
            O0,
            {
              href: h.href,
              onClick: h.onClick,
              underline: "hover",
              color: "inherit",
              sx: {
                cursor: h.onClick ? "pointer" : void 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              },
              children: h.label
            },
            g
          ) : /* @__PURE__ */ S(
            Be,
            {
              color: "text.primary",
              sx: {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              },
              children: h.label
            },
            g
          )
        ) }),
        i && /* @__PURE__ */ S(ee, { sx: { ml: c ? 0 : 2, flexShrink: 0 }, children: i })
      ]
    }
  );
}, Fy = ({
  title: r,
  dropdownItems: i,
  chip: o,
  actions: l,
  sx: f,
  className: c,
  component: h = "h1",
  variant: g = "h1"
}) => {
  const y = Qt(), b = jt(y.breakpoints.down("sm")), E = jt(y.breakpoints.down("md")), [R, N] = Jt(null), M = !!R, A = (H) => {
    N(H.currentTarget);
  }, k = () => {
    N(null);
  }, z = (H) => {
    H(), k();
  }, B = {
    fontSize: b ? "1.75rem" : E ? "2rem" : void 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: b ? 2 : 1,
    WebkitBoxOrient: "vertical",
    wordBreak: "break-word"
  };
  return /* @__PURE__ */ fe(
    ee,
    {
      sx: {
        display: "flex",
        flexDirection: b && l ? "column" : "row",
        justifyContent: "space-between",
        alignItems: b && l ? "flex-start" : "center",
        gap: b && l ? 2 : 0,
        my: 2.5
      },
      children: [
        /* @__PURE__ */ fe(
          ee,
          {
            sx: {
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: b ? 1 : 2,
              minWidth: 0,
              flex: 1
            },
            children: [
              i ? /* @__PURE__ */ fe(ee, { sx: { display: "flex", alignItems: "center", minWidth: 0 }, children: [
                /* @__PURE__ */ fe(
                  "button",
                  {
                    onClick: A,
                    "aria-controls": M ? "title-menu" : void 0,
                    "aria-haspopup": "true",
                    "aria-expanded": M ? "true" : void 0,
                    className: c,
                    style: {
                      background: "none",
                      border: "none",
                      padding: 0,
                      margin: 0,
                      font: "inherit",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      minWidth: 0
                    },
                    children: [
                      /* @__PURE__ */ S(
                        Be,
                        {
                          component: h,
                          variant: g,
                          sx: {
                            color: "primary.main",
                            "&:hover, &:focus-visible": {
                              textDecoration: "underline"
                            },
                            ...B,
                            ...f
                          },
                          children: r
                        }
                      ),
                      /* @__PURE__ */ S(
                        ec,
                        {
                          sx: {
                            color: "primary.main",
                            fontSize: b ? "1.5rem" : "2rem",
                            flexShrink: 0
                          }
                        }
                      )
                    ]
                  }
                ),
                /* @__PURE__ */ S(
                  P0,
                  {
                    id: "title-menu",
                    anchorEl: R,
                    open: M,
                    onClose: k,
                    slotProps: {
                      list: {
                        "aria-labelledby": "title-button"
                      }
                    },
                    children: i.map((H, L) => /* @__PURE__ */ S(M0, { onClick: () => z(H.onClick), children: H.label }, L))
                  }
                )
              ] }) : /* @__PURE__ */ S(
                Be,
                {
                  component: h,
                  variant: g,
                  className: c,
                  sx: {
                    ...B,
                    ...f
                  },
                  children: r
                }
              ),
              o
            ]
          }
        ),
        l && /* @__PURE__ */ S(
          ee,
          {
            sx: {
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              ml: b ? 0 : 2,
              flexShrink: 0
            },
            children: l
          }
        )
      ]
    }
  );
}, $y = ({ children: r, sx: i, className: o }) => /* @__PURE__ */ S(
  ee,
  {
    className: o,
    sx: {
      my: 2.5,
      ...i
    },
    children: r
  }
), zy = ({
  children: r,
  rightContent: i,
  value: o,
  onChange: l,
  sx: f,
  className: c
}) => {
  const h = Qt(), g = jt(h.breakpoints.down("sm")), y = jt(h.breakpoints.down("md"));
  return /* @__PURE__ */ fe(
    ee,
    {
      sx: {
        display: "flex",
        flexDirection: g && i ? "column" : "row",
        justifyContent: "space-between",
        alignItems: g && i ? "flex-start" : "center",
        gap: g && i ? 2 : 0,
        mt: 4
      },
      children: [
        /* @__PURE__ */ S(
          A0,
          {
            value: o,
            onChange: l,
            className: c,
            variant: y ? "scrollable" : "standard",
            scrollButtons: y ? "auto" : !1,
            sx: {
              minWidth: 0,
              flex: 1,
              ...f
            },
            children: r
          }
        ),
        i && /* @__PURE__ */ S(ee, { sx: { ml: g ? 0 : 2, mt: 0, flexShrink: 0 }, children: i })
      ]
    }
  );
};
Fo.Breadcrumbs = By;
Fo.Title = Fy;
Fo.Content = $y;
Fo.Tabs = zy;
function U1(r = !0) {
  const [i, o] = Jt(r), l = _o(() => {
    o((h) => !h);
  }, []), f = _o(() => {
    o(!0);
  }, []), c = _o(() => {
    o(!1);
  }, []);
  return {
    sidebarOpen: i,
    toggleSidebar: l,
    openSidebar: f,
    closeSidebar: c
  };
}
const nc = (r, i) => {
  switch (r) {
    case "primary":
      return i.palette.primary.main;
    case "secondary":
      return i.palette.secondary.main;
    case "success":
      return i.palette.success.main;
    case "info":
      return i.palette.info.main;
    case "warning":
      return i.palette.warning.main;
    case "error":
      return i.palette.error.main;
    case "primaryDark":
      return i.palette.primaryDark.main;
    case "tertiary":
      return i.palette.tertiary.main;
    default:
      return r;
  }
}, H1 = (...r) => r.filter(Boolean).join(" "), V1 = ({
  label: r,
  startIcon: i,
  color: o = "grey.900",
  size: l = "medium",
  sx: f,
  ...c
}) => {
  const h = Qt(), g = o === "grey.900" ? h.palette.grey[900] : nc(o, h), y = Nu(g, 0.12), b = l === "small", E = b ? h.spacing(3) : h.spacing(4), R = b ? h.typography.body2.fontSize : h.typography.body1.fontSize, N = b ? 20 : 24;
  return /* @__PURE__ */ S(
    N0,
    {
      label: r,
      icon: i,
      sx: {
        backgroundColor: y,
        color: h.palette.grey[900],
        fontSize: R,
        height: E,
        px: 1,
        "& .MuiChip-icon": {
          color: g,
          fontSize: N,
          width: N,
          height: N,
          marginRight: 0.75,
          marginLeft: 0
        },
        "& .MuiChip-label": {
          fontSize: R,
          px: 0
        },
        ...f
      },
      ...c
    }
  );
}, tc = _s(/* @__PURE__ */ S("path", {
  d: "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
}), "Check"), Wy = Lu(Du)(({ theme: r }) => ({
  [`&.${Ln.active}`]: {
    [`& .${Ln.line}`]: {
      borderColor: r.palette.primary.dark
    }
  },
  [`&.${Ln.completed}`]: {
    [`& .${Ln.line}`]: {
      borderColor: r.palette.primary.dark
    }
  },
  [`& .${Ln.line}`]: {
    borderColor: r.palette.divider,
    borderLeftWidth: 2,
    minHeight: 24
  }
})), vu = (r) => {
  const { active: i, completed: o, icon: l } = r, f = Cr();
  return /* @__PURE__ */ S(
    ee,
    {
      sx: {
        width: 24,
        height: 24,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: i || o ? f.palette.primary.main : f.palette.background.paper,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: i || o ? f.palette.primary.main : f.palette.action.disabled,
        color: i || o ? f.palette.background.default : f.palette.text.primary,
        fontSize: "0.75rem"
      },
      children: o ? /* @__PURE__ */ S(tc, {}) : l
    }
  );
}, Uy = ({ steps: r, activeStep: i, onStepClick: o, stepOffset: l = 0 }) => {
  const f = Cr();
  return /* @__PURE__ */ S(ee, { sx: { width: "100%" }, children: /* @__PURE__ */ S(ku, { activeStep: i, orientation: "vertical", connector: /* @__PURE__ */ S(Wy, {}), children: r.map((c, h) => {
    const g = h === i, y = c.completed || !1, b = l + h + 1;
    return /* @__PURE__ */ S(Bu, { completed: y, children: o ? /* @__PURE__ */ fe(
      L0,
      {
        onClick: () => o(h),
        "aria-label": `${c.label}${c.completed ? " (completed)" : ""}${g ? " (current step)" : ""}`,
        icon: /* @__PURE__ */ S(
          vu,
          {
            active: g,
            completed: y,
            icon: b
          }
        ),
        sx: {
          "& .MuiStepLabel-root": {
            color: y ? f.palette.primary.dark : g ? f.palette.primary.main : f.palette.text.primary,
            fontWeight: g ? 600 : 400,
            py: 0
          }
        },
        children: [
          c.label,
          c.optional && " (Optional)"
        ]
      }
    ) : /* @__PURE__ */ S(
      Fu,
      {
        slots: { stepIcon: vu },
        optional: c.optional ? "Optional" : void 0,
        sx: {
          "& .MuiStepLabel-label": {
            color: y ? f.palette.primary.dark : g ? f.palette.primary.main : f.palette.text.primary,
            fontWeight: g ? 600 : 400,
            py: 0
          }
        },
        children: c.label
      }
    ) }, h);
  }) }) });
}, G1 = ({ title: r, stepGroups: i, activeStep: o, onStepClick: l, sx: f }) => {
  let c = 0;
  const h = i.map((g) => {
    const y = c, b = g.steps.filter((R) => R.completed).length, E = g.steps.length;
    return c += E, { ...g, offset: y, completedCount: b, stepCount: E };
  });
  return /* @__PURE__ */ fe(ee, { sx: { width: "100%", ...f }, children: [
    r && /* @__PURE__ */ S(
      Be,
      {
        variant: "h6",
        sx: {
          color: "primary.dark",
          fontWeight: 600,
          letterSpacing: "0.15px",
          mb: 2
        },
        children: r
      }
    ),
    h.map((g, y) => {
      const b = o - g.offset, E = b >= 0 && b < g.stepCount;
      return /* @__PURE__ */ fe(ee, { children: [
        /* @__PURE__ */ fe(
          D0,
          {
            defaultExpanded: g.defaultExpanded ?? !0,
            expanded: g.expanded,
            onChange: (R, N) => g.onExpansionChange?.(N),
            elevation: 0,
            sx: { backgroundColor: "transparent" },
            children: [
              /* @__PURE__ */ S(
                k0,
                {
                  expandIcon: /* @__PURE__ */ S(ec, {}),
                  sx: {
                    pl: 1,
                    py: 1,
                    "&.Mui-expanded": {
                      minHeight: "auto"
                    },
                    "& .MuiAccordionSummary-content": {
                      my: 0
                    },
                    "& .MuiAccordionSummary-content.Mui-expanded": {
                      my: 0
                    }
                  },
                  children: /* @__PURE__ */ fe(
                    Be,
                    {
                      variant: "subtitle1",
                      fontWeight: 500,
                      sx: {
                        color: E ? "primary.dark" : "text.primary"
                      },
                      children: [
                        g.label || `Steps ${g.offset + 1}-${g.offset + g.stepCount}`,
                        " (",
                        g.stepCount,
                        ")"
                      ]
                    }
                  )
                }
              ),
              /* @__PURE__ */ S(B0, { sx: { p: 0, px: 2, pt: 2, pb: 1 }, children: /* @__PURE__ */ S(
                Uy,
                {
                  steps: g.steps,
                  activeStep: E ? b : -1,
                  onStepClick: l ? (R) => l(g.offset + R) : void 0,
                  stepOffset: g.offset
                }
              ) })
            ]
          }
        ),
        y < h.length - 1 && /* @__PURE__ */ S(F0, { sx: { my: 2 } })
      ] }, y);
    })
  ] });
}, K1 = ({
  icon: r,
  text: i,
  collapsed: o = !1,
  onClick: l,
  component: f = "button",
  sx: c,
  className: h,
  ...g
}) => {
  const y = g["aria-label"] ?? i, b = /* @__PURE__ */ fe(
    ee,
    {
      component: f,
      onClick: l,
      className: h,
      "aria-label": y,
      ...g,
      sx: {
        display: "flex",
        alignItems: "center",
        gap: o ? 0 : 1.5,
        px: o ? 1.5 : 3,
        py: 2,
        border: "none",
        background: "transparent",
        borderRadius: 0,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        width: "100%",
        textAlign: "left",
        justifyContent: o ? "center" : "flex-start",
        textDecoration: "none",
        "& .navitem-icon": {
          color: "tertiary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.2s ease-in-out"
        },
        "& .navitem-text": {
          color: "text.primary",
          transition: "color 0.2s ease-in-out"
        },
        "&:hover, &:focus-visible": {
          backgroundColor: "tertiary.main",
          outline: "none",
          "& .navitem-icon": {
            color: "tertiary.contrastText"
          },
          "& .navitem-text": {
            color: "tertiary.contrastText"
          }
        },
        ...c
      },
      children: [
        /* @__PURE__ */ S(ee, { className: "navitem-icon", children: r }),
        !o && /* @__PURE__ */ S(
          Be,
          {
            className: "navitem-text",
            variant: "body1",
            sx: {
              fontWeight: 500,
              fontSize: "0.95rem"
            },
            children: i
          }
        )
      ]
    }
  );
  return o ? /* @__PURE__ */ S($0, { title: i, placement: "right", arrow: !0, children: b }) : b;
}, rc = $u(void 0), ws = () => {
  const r = zu(rc);
  if (!r)
    throw new Error("useDropdown must be used within a Dropdown component");
  return r;
};
function Sr(r, i, o, l, f) {
  if (process.env.NODE_ENV === "production")
    return null;
  const c = r[i], h = f || i;
  return c == null ? null : c && c.nodeType !== 1 ? new Error(`Invalid ${l} \`${h}\` supplied to \`${o}\`. Expected an HTMLElement.`) : null;
}
function oc(r) {
  return typeof r == "string";
}
function ic(r, i, o) {
  return r === void 0 || oc(r) ? i : {
    ...i,
    ownerState: {
      ...i.ownerState,
      ...o
    }
  };
}
function sc(r, i = []) {
  if (r === void 0)
    return {};
  const o = {};
  return Object.keys(r).filter((l) => l.match(/^on[A-Z]/) && typeof r[l] == "function" && !i.includes(l)).forEach((l) => {
    o[l] = r[l];
  }), o;
}
function yu(r) {
  if (r === void 0)
    return {};
  const i = {};
  return Object.keys(r).filter((o) => !(o.match(/^on[A-Z]/) && typeof r[o] == "function")).forEach((o) => {
    i[o] = r[o];
  }), i;
}
function ac(r) {
  const {
    getSlotProps: i,
    additionalProps: o,
    externalSlotProps: l,
    externalForwardedProps: f,
    className: c
  } = r;
  if (!i) {
    const M = Te(o?.className, c, f?.className, l?.className), A = {
      ...o?.style,
      ...f?.style,
      ...l?.style
    }, k = {
      ...o,
      ...f,
      ...l
    };
    return M.length > 0 && (k.className = M), Object.keys(A).length > 0 && (k.style = A), {
      props: k,
      internalRef: void 0
    };
  }
  const h = sc({
    ...f,
    ...l
  }), g = yu(l), y = yu(f), b = i(h), E = Te(b?.className, o?.className, c, f?.className, l?.className), R = {
    ...b?.style,
    ...o?.style,
    ...f?.style,
    ...l?.style
  }, N = {
    ...b,
    ...o,
    ...y,
    ...g
  };
  return E.length > 0 && (N.className = E), Object.keys(R).length > 0 && (N.style = R), {
    props: N,
    internalRef: b.ref
  };
}
function lc(r, i, o) {
  return typeof r == "function" ? r(i, o) : r;
}
function Hy(r) {
  const {
    elementType: i,
    externalSlotProps: o,
    ownerState: l,
    skipResolvingSlotProps: f = !1,
    ...c
  } = r, h = f ? {} : lc(o, l), {
    props: g,
    internalRef: y
  } = ac({
    ...c,
    externalSlotProps: h
  }), b = Wn(y, h?.ref, r.additionalProps?.ref);
  return ic(i, {
    ...g,
    ref: b
  }, l);
}
const uc = /* @__PURE__ */ C.createContext({});
process.env.NODE_ENV !== "production" && (uc.displayName = "ListContext");
function Vy(r) {
  return _n("MuiList", r);
}
wn("MuiList", ["root", "padding", "dense", "subheader"]);
const Gy = (r) => {
  const {
    classes: i,
    disablePadding: o,
    dense: l,
    subheader: f
  } = r;
  return Dn({
    root: ["root", !o && "padding", l && "dense", f && "subheader"]
  }, Vy, i);
}, Ky = Pe("ul", {
  name: "MuiList",
  slot: "Root",
  overridesResolver: (r, i) => {
    const {
      ownerState: o
    } = r;
    return [i.root, !o.disablePadding && i.padding, o.dense && i.dense, o.subheader && i.subheader];
  }
})({
  listStyle: "none",
  margin: 0,
  padding: 0,
  position: "relative",
  variants: [{
    props: ({
      ownerState: r
    }) => !r.disablePadding,
    style: {
      paddingTop: 8,
      paddingBottom: 8
    }
  }, {
    props: ({
      ownerState: r
    }) => r.subheader,
    style: {
      paddingTop: 0
    }
  }]
}), cc = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const l = En({
    props: i,
    name: "MuiList"
  }), {
    children: f,
    className: c,
    component: h = "ul",
    dense: g = !1,
    disablePadding: y = !1,
    subheader: b,
    ...E
  } = l, R = C.useMemo(() => ({
    dense: g
  }), [g]), N = {
    ...l,
    component: h,
    dense: g,
    disablePadding: y
  }, M = Gy(N);
  return /* @__PURE__ */ S(uc.Provider, {
    value: R,
    children: /* @__PURE__ */ fe(Ky, {
      as: h,
      className: Te(M.root, c),
      ref: o,
      ownerState: N,
      ...E,
      children: [b, f]
    })
  });
});
process.env.NODE_ENV !== "production" && (cc.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: a.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: a.object,
  /**
   * @ignore
   */
  className: a.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: a.elementType,
  /**
   * If `true`, compact vertical padding designed for keyboard and mouse input is used for
   * the list and list items.
   * The prop is available to descendant components as the `dense` context.
   * @default false
   */
  dense: a.bool,
  /**
   * If `true`, vertical padding is removed from the list.
   * @default false
   */
  disablePadding: a.bool,
  /**
   * The content of the subheader, normally `ListSubheader`.
   */
  subheader: a.node,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: a.oneOfType([a.arrayOf(a.oneOfType([a.func, a.object, a.bool])), a.func, a.object])
});
function yr(r) {
  let i = r.activeElement;
  for (; i?.shadowRoot?.activeElement != null; )
    i = i.shadowRoot.activeElement;
  return i;
}
function fc(r = window) {
  const i = r.document.documentElement.clientWidth;
  return r.innerWidth - i;
}
function us(r, i, o) {
  return r === i ? r.firstChild : i && i.nextElementSibling ? i.nextElementSibling : o ? null : r.firstChild;
}
function bu(r, i, o) {
  return r === i ? o ? r.firstChild : r.lastChild : i && i.previousElementSibling ? i.previousElementSibling : o ? null : r.lastChild;
}
function dc(r, i) {
  if (i === void 0)
    return !0;
  let o = r.innerText;
  return o === void 0 && (o = r.textContent), o = o.trim().toLowerCase(), o.length === 0 ? !1 : i.repeating ? o[0] === i.keys[0] : o.startsWith(i.keys.join(""));
}
function vr(r, i, o, l, f, c) {
  let h = !1, g = f(r, i, i ? o : !1);
  for (; g; ) {
    if (g === r.firstChild) {
      if (h)
        return !1;
      h = !0;
    }
    const y = l ? !1 : g.disabled || g.getAttribute("aria-disabled") === "true";
    if (!g.hasAttribute("tabindex") || !dc(g, c) || y)
      g = f(r, g, o);
    else
      return g.focus(), !0;
  }
  return !1;
}
const pc = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const {
    // private
    // eslint-disable-next-line react/prop-types
    actions: l,
    autoFocus: f = !1,
    autoFocusItem: c = !1,
    children: h,
    className: g,
    disabledItemsFocusable: y = !1,
    disableListWrap: b = !1,
    onKeyDown: E,
    variant: R = "selectedMenu",
    ...N
  } = i, M = C.useRef(null), A = C.useRef({
    keys: [],
    repeating: !0,
    previousKeyMatched: !0,
    lastTime: null
  });
  Ro(() => {
    f && M.current.focus();
  }, [f]), C.useImperativeHandle(l, () => ({
    adjustStyleForScrollbar: (L, {
      direction: D
    }) => {
      const U = !M.current.style.width;
      if (L.clientHeight < M.current.clientHeight && U) {
        const q = `${fc(Pt(L))}px`;
        M.current.style[D === "rtl" ? "paddingLeft" : "paddingRight"] = q, M.current.style.width = `calc(100% + ${q})`;
      }
      return M.current;
    }
  }), []);
  const k = (L) => {
    const D = M.current, U = L.key;
    if (L.ctrlKey || L.metaKey || L.altKey) {
      E && E(L);
      return;
    }
    const W = yr(zn(D));
    if (U === "ArrowDown")
      L.preventDefault(), vr(D, W, b, y, us);
    else if (U === "ArrowUp")
      L.preventDefault(), vr(D, W, b, y, bu);
    else if (U === "Home")
      L.preventDefault(), vr(D, null, b, y, us);
    else if (U === "End")
      L.preventDefault(), vr(D, null, b, y, bu);
    else if (U.length === 1) {
      const G = A.current, Z = U.toLowerCase(), ge = performance.now();
      G.keys.length > 0 && (ge - G.lastTime > 500 ? (G.keys = [], G.repeating = !0, G.previousKeyMatched = !0) : G.repeating && Z !== G.keys[0] && (G.repeating = !1)), G.lastTime = ge, G.keys.push(Z);
      const de = W && !G.repeating && dc(W, G);
      G.previousKeyMatched && (de || vr(D, W, !1, y, us, G)) ? L.preventDefault() : G.previousKeyMatched = !1;
    }
    E && E(L);
  }, z = Wn(M, o);
  let B = -1;
  C.Children.forEach(h, (L, D) => {
    if (!/* @__PURE__ */ C.isValidElement(L)) {
      B === D && (B += 1, B >= h.length && (B = -1));
      return;
    }
    process.env.NODE_ENV !== "production" && So.isFragment(L) && console.error(["MUI: The Menu component doesn't accept a Fragment as a child.", "Consider providing an array instead."].join(`
`)), L.props.disabled || (R === "selectedMenu" && L.props.selected || B === -1) && (B = D), B === D && (L.props.disabled || L.props.muiSkipListHighlight || L.type.muiSkipListHighlight) && (B += 1, B >= h.length && (B = -1));
  });
  const H = C.Children.map(h, (L, D) => {
    if (D === B) {
      const U = {};
      return c && (U.autoFocus = !0), L.props.tabIndex === void 0 && R === "selectedMenu" && (U.tabIndex = 0), /* @__PURE__ */ C.cloneElement(L, U);
    }
    return L;
  });
  return /* @__PURE__ */ S(cc, {
    role: "menu",
    ref: z,
    className: g,
    onKeyDown: k,
    tabIndex: f ? 0 : -1,
    ...N,
    children: H
  });
});
process.env.NODE_ENV !== "production" && (pc.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, will focus the `[role="menu"]` container and move into tab order.
   * @default false
   */
  autoFocus: a.bool,
  /**
   * If `true`, will focus the first menuitem if `variant="menu"` or selected item
   * if `variant="selectedMenu"`.
   * @default false
   */
  autoFocusItem: a.bool,
  /**
   * MenuList contents, normally `MenuItem`s.
   */
  children: a.node,
  /**
   * @ignore
   */
  className: a.string,
  /**
   * If `true`, will allow focus on disabled items.
   * @default false
   */
  disabledItemsFocusable: a.bool,
  /**
   * If `true`, the menu items will not wrap focus.
   * @default false
   */
  disableListWrap: a.bool,
  /**
   * @ignore
   */
  onKeyDown: a.func,
  /**
   * The variant to use. Use `menu` to prevent selected items from impacting the initial focus
   * and the vertical alignment relative to the anchor element.
   * @default 'selectedMenu'
   */
  variant: a.oneOf(["menu", "selectedMenu"])
});
const hc = a.oneOfType([a.func, a.object]);
function Mt(r, i) {
  return process.env.NODE_ENV === "production" ? () => null : function(...l) {
    return r(...l) || i(...l);
  };
}
function qy(r) {
  const {
    prototype: i = {}
  } = r;
  return !!i.isReactComponent;
}
function Yy(r, i, o, l, f) {
  const c = r[i], h = f || i;
  if (c == null || // When server-side rendering React doesn't warn either.
  // This is not an accurate check for SSR.
  // This is only in place for emotion compat.
  // TODO: Revisit once https://github.com/facebook/react/issues/20047 is resolved.
  typeof window > "u")
    return null;
  let g;
  return typeof c == "function" && !qy(c) && (g = "Did you accidentally provide a plain function component instead?"), c === C.Fragment && (g = "Did you accidentally provide a React.Fragment instead?"), g !== void 0 ? new Error(`Invalid ${l} \`${h}\` supplied to \`${o}\`. Expected an element type that can hold a ref. ${g} For more information see https://mui.com/r/caveat-with-refs-guide`) : null;
}
const gc = Mt(a.elementType, Yy);
function Xy(r) {
  const i = typeof r;
  switch (i) {
    case "number":
      return Number.isNaN(r) ? "NaN" : Number.isFinite(r) ? r !== Math.floor(r) ? "float" : "number" : "Infinity";
    case "object":
      return r === null ? "null" : r.constructor.name;
    default:
      return i;
  }
}
function mc(r, i, o, l) {
  const f = r[i];
  if (f == null || !Number.isInteger(f)) {
    const c = Xy(f);
    return new RangeError(`Invalid ${l} \`${i}\` of type \`${c}\` supplied to \`${o}\`, expected \`integer\`.`);
  }
  return null;
}
function vc(r, i, o, l) {
  return r[i] === void 0 ? null : mc(r, i, o, l);
}
function ds() {
  return null;
}
vc.isRequired = mc;
ds.isRequired = ds;
const yc = process.env.NODE_ENV === "production" ? ds : vc, xu = {};
function bc(r, i) {
  const o = C.useRef(xu);
  return o.current === xu && (o.current = r(i)), o;
}
const Zy = [];
function jy(r) {
  C.useEffect(r, Zy);
}
class Es {
  static create() {
    return new Es();
  }
  currentId = null;
  /**
   * Executes `fn` after `delay`, clearing any previously scheduled call.
   */
  start(i, o) {
    this.clear(), this.currentId = setTimeout(() => {
      this.currentId = null, o();
    }, i);
  }
  clear = () => {
    this.currentId !== null && (clearTimeout(this.currentId), this.currentId = null);
  };
  disposeEffect = () => this.clear;
}
function xc() {
  const r = bc(Es.create).current;
  return jy(r.disposeEffect), r;
}
function Jy(r) {
  const {
    prototype: i = {}
  } = r;
  return !!i.isReactComponent;
}
function _c(r, i, o, l, f) {
  const c = r[i], h = f || i;
  if (c == null || // When server-side rendering React doesn't warn either.
  // This is not an accurate check for SSR.
  // This is only in place for Emotion compat.
  // TODO: Revisit once https://github.com/facebook/react/issues/20047 is resolved.
  typeof window > "u")
    return null;
  let g;
  const y = c.type;
  return typeof y == "function" && !Jy(y) && (g = "Did you accidentally use a plain function component for an element instead?"), g !== void 0 ? new Error(`Invalid ${l} \`${h}\` supplied to \`${o}\`. Expected an element that can hold a ref. ${g} For more information see https://mui.com/r/caveat-with-refs-guide`) : null;
}
const Rr = Mt(a.element, _c);
Rr.isRequired = Mt(a.element.isRequired, _c);
function $o(r) {
  return parseInt(C.version, 10) >= 19 ? r?.props?.ref || null : r?.ref || null;
}
function ps() {
  return ps = Object.assign ? Object.assign.bind() : function(r) {
    for (var i = 1; i < arguments.length; i++) {
      var o = arguments[i];
      for (var l in o) ({}).hasOwnProperty.call(o, l) && (r[l] = o[l]);
    }
    return r;
  }, ps.apply(null, arguments);
}
function wc(r, i) {
  if (r == null) return {};
  var o = {};
  for (var l in r) if ({}.hasOwnProperty.call(r, l)) {
    if (i.indexOf(l) !== -1) continue;
    o[l] = r[l];
  }
  return o;
}
function hs(r, i) {
  return hs = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(o, l) {
    return o.__proto__ = l, o;
  }, hs(r, i);
}
function Ec(r, i) {
  r.prototype = Object.create(i.prototype), r.prototype.constructor = r, hs(r, i);
}
const _u = {
  disabled: !1
};
var Qy = process.env.NODE_ENV !== "production" ? a.oneOfType([a.number, a.shape({
  enter: a.number,
  exit: a.number,
  appear: a.number
}).isRequired]) : null;
process.env.NODE_ENV !== "production" && a.oneOfType([a.string, a.shape({
  enter: a.string,
  exit: a.string,
  active: a.string
}), a.shape({
  enter: a.string,
  enterDone: a.string,
  enterActive: a.string,
  exit: a.string,
  exitDone: a.string,
  exitActive: a.string
})]);
const Oo = nt.createContext(null);
var eb = function(i) {
  return i.scrollTop;
}, br = "unmounted", Tt = "exited", Ct = "entering", Xt = "entered", gs = "exiting", Un = /* @__PURE__ */ (function(r) {
  Ec(i, r);
  function i(l, f) {
    var c;
    c = r.call(this, l, f) || this;
    var h = f, g = h && !h.isMounting ? l.enter : l.appear, y;
    return c.appearStatus = null, l.in ? g ? (y = Tt, c.appearStatus = Ct) : y = Xt : l.unmountOnExit || l.mountOnEnter ? y = br : y = Tt, c.state = {
      status: y
    }, c.nextCallback = null, c;
  }
  i.getDerivedStateFromProps = function(f, c) {
    var h = f.in;
    return h && c.status === br ? {
      status: Tt
    } : null;
  };
  var o = i.prototype;
  return o.componentDidMount = function() {
    this.updateStatus(!0, this.appearStatus);
  }, o.componentDidUpdate = function(f) {
    var c = null;
    if (f !== this.props) {
      var h = this.state.status;
      this.props.in ? h !== Ct && h !== Xt && (c = Ct) : (h === Ct || h === Xt) && (c = gs);
    }
    this.updateStatus(!1, c);
  }, o.componentWillUnmount = function() {
    this.cancelNextCallback();
  }, o.getTimeouts = function() {
    var f = this.props.timeout, c, h, g;
    return c = h = g = f, f != null && typeof f != "number" && (c = f.exit, h = f.enter, g = f.appear !== void 0 ? f.appear : h), {
      exit: c,
      enter: h,
      appear: g
    };
  }, o.updateStatus = function(f, c) {
    if (f === void 0 && (f = !1), c !== null)
      if (this.cancelNextCallback(), c === Ct) {
        if (this.props.unmountOnExit || this.props.mountOnEnter) {
          var h = this.props.nodeRef ? this.props.nodeRef.current : bo.findDOMNode(this);
          h && eb(h);
        }
        this.performEnter(f);
      } else
        this.performExit();
    else this.props.unmountOnExit && this.state.status === Tt && this.setState({
      status: br
    });
  }, o.performEnter = function(f) {
    var c = this, h = this.props.enter, g = this.context ? this.context.isMounting : f, y = this.props.nodeRef ? [g] : [bo.findDOMNode(this), g], b = y[0], E = y[1], R = this.getTimeouts(), N = g ? R.appear : R.enter;
    if (!f && !h || _u.disabled) {
      this.safeSetState({
        status: Xt
      }, function() {
        c.props.onEntered(b);
      });
      return;
    }
    this.props.onEnter(b, E), this.safeSetState({
      status: Ct
    }, function() {
      c.props.onEntering(b, E), c.onTransitionEnd(N, function() {
        c.safeSetState({
          status: Xt
        }, function() {
          c.props.onEntered(b, E);
        });
      });
    });
  }, o.performExit = function() {
    var f = this, c = this.props.exit, h = this.getTimeouts(), g = this.props.nodeRef ? void 0 : bo.findDOMNode(this);
    if (!c || _u.disabled) {
      this.safeSetState({
        status: Tt
      }, function() {
        f.props.onExited(g);
      });
      return;
    }
    this.props.onExit(g), this.safeSetState({
      status: gs
    }, function() {
      f.props.onExiting(g), f.onTransitionEnd(h.exit, function() {
        f.safeSetState({
          status: Tt
        }, function() {
          f.props.onExited(g);
        });
      });
    });
  }, o.cancelNextCallback = function() {
    this.nextCallback !== null && (this.nextCallback.cancel(), this.nextCallback = null);
  }, o.safeSetState = function(f, c) {
    c = this.setNextCallback(c), this.setState(f, c);
  }, o.setNextCallback = function(f) {
    var c = this, h = !0;
    return this.nextCallback = function(g) {
      h && (h = !1, c.nextCallback = null, f(g));
    }, this.nextCallback.cancel = function() {
      h = !1;
    }, this.nextCallback;
  }, o.onTransitionEnd = function(f, c) {
    this.setNextCallback(c);
    var h = this.props.nodeRef ? this.props.nodeRef.current : bo.findDOMNode(this), g = f == null && !this.props.addEndListener;
    if (!h || g) {
      setTimeout(this.nextCallback, 0);
      return;
    }
    if (this.props.addEndListener) {
      var y = this.props.nodeRef ? [this.nextCallback] : [h, this.nextCallback], b = y[0], E = y[1];
      this.props.addEndListener(b, E);
    }
    f != null && setTimeout(this.nextCallback, f);
  }, o.render = function() {
    var f = this.state.status;
    if (f === br)
      return null;
    var c = this.props, h = c.children;
    c.in, c.mountOnEnter, c.unmountOnExit, c.appear, c.enter, c.exit, c.timeout, c.addEndListener, c.onEnter, c.onEntering, c.onEntered, c.onExit, c.onExiting, c.onExited, c.nodeRef;
    var g = wc(c, ["children", "in", "mountOnEnter", "unmountOnExit", "appear", "enter", "exit", "timeout", "addEndListener", "onEnter", "onEntering", "onEntered", "onExit", "onExiting", "onExited", "nodeRef"]);
    return (
      // allows for nested Transitions
      /* @__PURE__ */ nt.createElement(Oo.Provider, {
        value: null
      }, typeof h == "function" ? h(f, g) : nt.cloneElement(nt.Children.only(h), g))
    );
  }, i;
})(nt.Component);
Un.contextType = Oo;
Un.propTypes = process.env.NODE_ENV !== "production" ? {
  /**
   * A React reference to DOM element that need to transition:
   * https://stackoverflow.com/a/51127130/4671932
   *
   *   - When `nodeRef` prop is used, `node` is not passed to callback functions
   *      (e.g. `onEnter`) because user already has direct access to the node.
   *   - When changing `key` prop of `Transition` in a `TransitionGroup` a new
   *     `nodeRef` need to be provided to `Transition` with changed `key` prop
   *     (see
   *     [test/CSSTransition-test.js](https://github.com/reactjs/react-transition-group/blob/13435f897b3ab71f6e19d724f145596f5910581c/test/CSSTransition-test.js#L362-L437)).
   */
  nodeRef: a.shape({
    current: typeof Element > "u" ? a.any : function(r, i, o, l, f, c) {
      var h = r[i];
      return a.instanceOf(h && "ownerDocument" in h ? h.ownerDocument.defaultView.Element : Element)(r, i, o, l, f, c);
    }
  }),
  /**
   * A `function` child can be used instead of a React element. This function is
   * called with the current transition status (`'entering'`, `'entered'`,
   * `'exiting'`, `'exited'`), which can be used to apply context
   * specific props to a component.
   *
   * ```jsx
   * <Transition in={this.state.in} timeout={150}>
   *   {state => (
   *     <MyComponent className={`fade fade-${state}`} />
   *   )}
   * </Transition>
   * ```
   */
  children: a.oneOfType([a.func.isRequired, a.element.isRequired]).isRequired,
  /**
   * Show the component; triggers the enter or exit states
   */
  in: a.bool,
  /**
   * By default the child component is mounted immediately along with
   * the parent `Transition` component. If you want to "lazy mount" the component on the
   * first `in={true}` you can set `mountOnEnter`. After the first enter transition the component will stay
   * mounted, even on "exited", unless you also specify `unmountOnExit`.
   */
  mountOnEnter: a.bool,
  /**
   * By default the child component stays mounted after it reaches the `'exited'` state.
   * Set `unmountOnExit` if you'd prefer to unmount the component after it finishes exiting.
   */
  unmountOnExit: a.bool,
  /**
   * By default the child component does not perform the enter transition when
   * it first mounts, regardless of the value of `in`. If you want this
   * behavior, set both `appear` and `in` to `true`.
   *
   * > **Note**: there are no special appear states like `appearing`/`appeared`, this prop
   * > only adds an additional enter transition. However, in the
   * > `<CSSTransition>` component that first enter transition does result in
   * > additional `.appear-*` classes, that way you can choose to style it
   * > differently.
   */
  appear: a.bool,
  /**
   * Enable or disable enter transitions.
   */
  enter: a.bool,
  /**
   * Enable or disable exit transitions.
   */
  exit: a.bool,
  /**
   * The duration of the transition, in milliseconds.
   * Required unless `addEndListener` is provided.
   *
   * You may specify a single timeout for all transitions:
   *
   * ```jsx
   * timeout={500}
   * ```
   *
   * or individually:
   *
   * ```jsx
   * timeout={{
   *  appear: 500,
   *  enter: 300,
   *  exit: 500,
   * }}
   * ```
   *
   * - `appear` defaults to the value of `enter`
   * - `enter` defaults to `0`
   * - `exit` defaults to `0`
   *
   * @type {number | { enter?: number, exit?: number, appear?: number }}
   */
  timeout: function(i) {
    var o = Qy;
    i.addEndListener || (o = o.isRequired);
    for (var l = arguments.length, f = new Array(l > 1 ? l - 1 : 0), c = 1; c < l; c++)
      f[c - 1] = arguments[c];
    return o.apply(void 0, [i].concat(f));
  },
  /**
   * Add a custom transition end trigger. Called with the transitioning
   * DOM node and a `done` callback. Allows for more fine grained transition end
   * logic. Timeouts are still used as a fallback if provided.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * ```jsx
   * addEndListener={(node, done) => {
   *   // use the css transitionend event to mark the finish of a transition
   *   node.addEventListener('transitionend', done, false);
   * }}
   * ```
   */
  addEndListener: a.func,
  /**
   * Callback fired before the "entering" status is applied. An extra parameter
   * `isAppearing` is supplied to indicate if the enter stage is occurring on the initial mount
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement, isAppearing: bool) -> void
   */
  onEnter: a.func,
  /**
   * Callback fired after the "entering" status is applied. An extra parameter
   * `isAppearing` is supplied to indicate if the enter stage is occurring on the initial mount
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement, isAppearing: bool)
   */
  onEntering: a.func,
  /**
   * Callback fired after the "entered" status is applied. An extra parameter
   * `isAppearing` is supplied to indicate if the enter stage is occurring on the initial mount
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement, isAppearing: bool) -> void
   */
  onEntered: a.func,
  /**
   * Callback fired before the "exiting" status is applied.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement) -> void
   */
  onExit: a.func,
  /**
   * Callback fired after the "exiting" status is applied.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement) -> void
   */
  onExiting: a.func,
  /**
   * Callback fired after the "exited" status is applied.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed
   *
   * @type Function(node: HtmlElement) -> void
   */
  onExited: a.func
} : {};
function Yt() {
}
Un.defaultProps = {
  in: !1,
  mountOnEnter: !1,
  unmountOnExit: !1,
  appear: !1,
  enter: !0,
  exit: !0,
  onEnter: Yt,
  onEntering: Yt,
  onEntered: Yt,
  onExit: Yt,
  onExiting: Yt,
  onExited: Yt
};
Un.UNMOUNTED = br;
Un.EXITED = Tt;
Un.ENTERING = Ct;
Un.ENTERED = Xt;
Un.EXITING = gs;
function nb(r) {
  if (r === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return r;
}
function Ss(r, i) {
  var o = function(c) {
    return i && wo(c) ? i(c) : c;
  }, l = /* @__PURE__ */ Object.create(null);
  return r && V0.map(r, function(f) {
    return f;
  }).forEach(function(f) {
    l[f.key] = o(f);
  }), l;
}
function tb(r, i) {
  r = r || {}, i = i || {};
  function o(E) {
    return E in i ? i[E] : r[E];
  }
  var l = /* @__PURE__ */ Object.create(null), f = [];
  for (var c in r)
    c in i ? f.length && (l[c] = f, f = []) : f.push(c);
  var h, g = {};
  for (var y in i) {
    if (l[y])
      for (h = 0; h < l[y].length; h++) {
        var b = l[y][h];
        g[l[y][h]] = o(b);
      }
    g[y] = o(y);
  }
  for (h = 0; h < f.length; h++)
    g[f[h]] = o(f[h]);
  return g;
}
function It(r, i, o) {
  return o[i] != null ? o[i] : r.props[i];
}
function rb(r, i) {
  return Ss(r.children, function(o) {
    return wr(o, {
      onExited: i.bind(null, o),
      in: !0,
      appear: It(o, "appear", r),
      enter: It(o, "enter", r),
      exit: It(o, "exit", r)
    });
  });
}
function ob(r, i, o) {
  var l = Ss(r.children), f = tb(i, l);
  return Object.keys(f).forEach(function(c) {
    var h = f[c];
    if (wo(h)) {
      var g = c in i, y = c in l, b = i[c], E = wo(b) && !b.props.in;
      y && (!g || E) ? f[c] = wr(h, {
        onExited: o.bind(null, h),
        in: !0,
        exit: It(h, "exit", r),
        enter: It(h, "enter", r)
      }) : !y && g && !E ? f[c] = wr(h, {
        in: !1
      }) : y && g && wo(b) && (f[c] = wr(h, {
        onExited: o.bind(null, h),
        in: b.props.in,
        exit: It(h, "exit", r),
        enter: It(h, "enter", r)
      }));
    }
  }), f;
}
var ib = Object.values || function(r) {
  return Object.keys(r).map(function(i) {
    return r[i];
  });
}, sb = {
  component: "div",
  childFactory: function(i) {
    return i;
  }
}, Ts = /* @__PURE__ */ (function(r) {
  Ec(i, r);
  function i(l, f) {
    var c;
    c = r.call(this, l, f) || this;
    var h = c.handleExited.bind(nb(c));
    return c.state = {
      contextValue: {
        isMounting: !0
      },
      handleExited: h,
      firstRender: !0
    }, c;
  }
  var o = i.prototype;
  return o.componentDidMount = function() {
    this.mounted = !0, this.setState({
      contextValue: {
        isMounting: !1
      }
    });
  }, o.componentWillUnmount = function() {
    this.mounted = !1;
  }, i.getDerivedStateFromProps = function(f, c) {
    var h = c.children, g = c.handleExited, y = c.firstRender;
    return {
      children: y ? rb(f, g) : ob(f, h, g),
      firstRender: !1
    };
  }, o.handleExited = function(f, c) {
    var h = Ss(this.props.children);
    f.key in h || (f.props.onExited && f.props.onExited(c), this.mounted && this.setState(function(g) {
      var y = ps({}, g.children);
      return delete y[f.key], {
        children: y
      };
    }));
  }, o.render = function() {
    var f = this.props, c = f.component, h = f.childFactory, g = wc(f, ["component", "childFactory"]), y = this.state.contextValue, b = ib(this.state.children).map(h);
    return delete g.appear, delete g.enter, delete g.exit, c === null ? /* @__PURE__ */ nt.createElement(Oo.Provider, {
      value: y
    }, b) : /* @__PURE__ */ nt.createElement(Oo.Provider, {
      value: y
    }, /* @__PURE__ */ nt.createElement(c, g, b));
  }, i;
})(nt.Component);
Ts.propTypes = process.env.NODE_ENV !== "production" ? {
  /**
   * `<TransitionGroup>` renders a `<div>` by default. You can change this
   * behavior by providing a `component` prop.
   * If you use React v16+ and would like to avoid a wrapping `<div>` element
   * you can pass in `component={null}`. This is useful if the wrapping div
   * borks your css styles.
   */
  component: a.any,
  /**
   * A set of `<Transition>` components, that are toggled `in` and out as they
   * leave. the `<TransitionGroup>` will inject specific transition props, so
   * remember to spread them through if you are wrapping the `<Transition>` as
   * with our `<Fade>` example.
   *
   * While this component is meant for multiple `Transition` or `CSSTransition`
   * children, sometimes you may want to have a single transition child with
   * content that you want to be transitioned out and in when you change it
   * (e.g. routes, images etc.) In that case you can change the `key` prop of
   * the transition child as you change its content, this will cause
   * `TransitionGroup` to transition the child out and back in.
   */
  children: a.node,
  /**
   * A convenience prop that enables or disables appear animations
   * for all children. Note that specifying this will override any defaults set
   * on individual children Transitions.
   */
  appear: a.bool,
  /**
   * A convenience prop that enables or disables enter animations
   * for all children. Note that specifying this will override any defaults set
   * on individual children Transitions.
   */
  enter: a.bool,
  /**
   * A convenience prop that enables or disables exit animations
   * for all children. Note that specifying this will override any defaults set
   * on individual children Transitions.
   */
  exit: a.bool,
  /**
   * You may need to apply reactive updates to a child as it is exiting.
   * This is generally done by using `cloneElement` however in the case of an exiting
   * child the element has already been removed and not accessible to the consumer.
   *
   * If you do need to update a child as it leaves you can provide a `childFactory`
   * to wrap every child, even the ones that are leaving.
   *
   * @type Function(child: ReactElement) -> ReactElement
   */
  childFactory: a.func
} : {};
Ts.defaultProps = sb;
const Sc = (r) => r.scrollTop;
function Po(r, i) {
  const {
    timeout: o,
    easing: l,
    style: f = {}
  } = r;
  return {
    duration: f.transitionDuration ?? (typeof o == "number" ? o : o[i.mode] || 0),
    easing: f.transitionTimingFunction ?? (typeof l == "object" ? l[i.mode] : l),
    delay: f.transitionDelay
  };
}
function ms(r) {
  return `scale(${r}, ${r ** 2})`;
}
const ab = {
  entering: {
    opacity: 1,
    transform: ms(1)
  },
  entered: {
    opacity: 1,
    transform: "none"
  }
}, cs = typeof navigator < "u" && /^((?!chrome|android).)*(safari|mobile)/i.test(navigator.userAgent) && /(os |version\/)15(.|_)4/i.test(navigator.userAgent), Mo = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const {
    addEndListener: l,
    appear: f = !0,
    children: c,
    easing: h,
    in: g,
    onEnter: y,
    onEntered: b,
    onEntering: E,
    onExit: R,
    onExited: N,
    onExiting: M,
    style: A,
    timeout: k = "auto",
    // eslint-disable-next-line react/prop-types
    TransitionComponent: z = Un,
    ...B
  } = i, H = xc(), L = C.useRef(), D = Cr(), U = C.useRef(null), q = Wn(U, $o(c), o), W = ($) => (K) => {
    if ($) {
      const le = U.current;
      K === void 0 ? $(le) : $(le, K);
    }
  }, G = W(E), Z = W(($, K) => {
    Sc($);
    const {
      duration: le,
      delay: Ce,
      easing: X
    } = Po({
      style: A,
      timeout: k,
      easing: h
    }, {
      mode: "enter"
    });
    let we;
    k === "auto" ? (we = D.transitions.getAutoHeightDuration($.clientHeight), L.current = we) : we = le, $.style.transition = [D.transitions.create("opacity", {
      duration: we,
      delay: Ce
    }), D.transitions.create("transform", {
      duration: cs ? we : we * 0.666,
      delay: Ce,
      easing: X
    })].join(","), y && y($, K);
  }), ge = W(b), de = W(M), se = W(($) => {
    const {
      duration: K,
      delay: le,
      easing: Ce
    } = Po({
      style: A,
      timeout: k,
      easing: h
    }, {
      mode: "exit"
    });
    let X;
    k === "auto" ? (X = D.transitions.getAutoHeightDuration($.clientHeight), L.current = X) : X = K, $.style.transition = [D.transitions.create("opacity", {
      duration: X,
      delay: le
    }), D.transitions.create("transform", {
      duration: cs ? X : X * 0.666,
      delay: cs ? le : le || X * 0.333,
      easing: Ce
    })].join(","), $.style.opacity = 0, $.style.transform = ms(0.75), R && R($);
  }), re = W(N);
  return /* @__PURE__ */ S(z, {
    appear: f,
    in: g,
    nodeRef: U,
    onEnter: Z,
    onEntered: ge,
    onEntering: G,
    onExit: se,
    onExited: re,
    onExiting: de,
    addEndListener: ($) => {
      k === "auto" && H.start(L.current || 0, $), l && l(U.current, $);
    },
    timeout: k === "auto" ? null : k,
    ...B,
    children: ($, {
      ownerState: K,
      ...le
    }) => /* @__PURE__ */ C.cloneElement(c, {
      style: {
        opacity: 0,
        transform: ms(0.75),
        visibility: $ === "exited" && !g ? "hidden" : void 0,
        ...ab[$],
        ...A,
        ...c.props.style
      },
      ref: q,
      ...le
    })
  });
});
process.env.NODE_ENV !== "production" && (Mo.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Add a custom transition end trigger. Called with the transitioning DOM
   * node and a done callback. Allows for more fine grained transition end
   * logic. Note: Timeouts are still used as a fallback if provided.
   */
  addEndListener: a.func,
  /**
   * Perform the enter transition when it first mounts if `in` is also `true`.
   * Set this to `false` to disable this behavior.
   * @default true
   */
  appear: a.bool,
  /**
   * A single child content element.
   */
  children: Rr.isRequired,
  /**
   * The transition timing function.
   * You may specify a single easing or a object containing enter and exit values.
   */
  easing: a.oneOfType([a.shape({
    enter: a.string,
    exit: a.string
  }), a.string]),
  /**
   * If `true`, the component will transition in.
   */
  in: a.bool,
  /**
   * @ignore
   */
  onEnter: a.func,
  /**
   * @ignore
   */
  onEntered: a.func,
  /**
   * @ignore
   */
  onEntering: a.func,
  /**
   * @ignore
   */
  onExit: a.func,
  /**
   * @ignore
   */
  onExited: a.func,
  /**
   * @ignore
   */
  onExiting: a.func,
  /**
   * @ignore
   */
  style: a.object,
  /**
   * The duration for the transition, in milliseconds.
   * You may specify a single timeout for all transitions, or individually with an object.
   *
   * Set to 'auto' to automatically calculate transition time based on height.
   * @default 'auto'
   */
  timeout: a.oneOfType([a.oneOf(["auto"]), a.number, a.shape({
    appear: a.number,
    enter: a.number,
    exit: a.number
  })])
});
Mo && (Mo.muiSupportAuto = !0);
function lb(r) {
  const i = zn(r);
  return i.body === r ? Pt(r).innerWidth > i.documentElement.clientWidth : r.scrollHeight > r.clientHeight;
}
function Er(r, i) {
  i ? r.setAttribute("aria-hidden", "true") : r.removeAttribute("aria-hidden");
}
function wu(r) {
  return parseFloat(Pt(r).getComputedStyle(r).paddingRight) || 0;
}
function ub(r) {
  const o = ["TEMPLATE", "SCRIPT", "STYLE", "LINK", "MAP", "META", "NOSCRIPT", "PICTURE", "COL", "COLGROUP", "PARAM", "SLOT", "SOURCE", "TRACK"].includes(r.tagName), l = r.tagName === "INPUT" && r.getAttribute("type") === "hidden";
  return o || l;
}
function Eu(r, i, o, l, f) {
  const c = [i, o, ...l];
  [].forEach.call(r.children, (h) => {
    const g = !c.includes(h), y = !ub(h);
    g && y && Er(h, f);
  });
}
function fs(r, i) {
  let o = -1;
  return r.some((l, f) => i(l) ? (o = f, !0) : !1), o;
}
function cb(r, i) {
  const o = [], l = r.container;
  if (!i.disableScrollLock) {
    if (lb(l)) {
      const h = fc(Pt(l));
      o.push({
        value: l.style.paddingRight,
        property: "padding-right",
        el: l
      }), l.style.paddingRight = `${wu(l) + h}px`;
      const g = zn(l).querySelectorAll(".mui-fixed");
      [].forEach.call(g, (y) => {
        o.push({
          value: y.style.paddingRight,
          property: "padding-right",
          el: y
        }), y.style.paddingRight = `${wu(y) + h}px`;
      });
    }
    let c;
    if (l.parentNode instanceof DocumentFragment)
      c = zn(l).body;
    else {
      const h = l.parentElement, g = Pt(l);
      c = h?.nodeName === "HTML" && g.getComputedStyle(h).overflowY === "scroll" ? h : l;
    }
    o.push({
      value: c.style.overflow,
      property: "overflow",
      el: c
    }, {
      value: c.style.overflowX,
      property: "overflow-x",
      el: c
    }, {
      value: c.style.overflowY,
      property: "overflow-y",
      el: c
    }), c.style.overflow = "hidden";
  }
  return () => {
    o.forEach(({
      value: c,
      el: h,
      property: g
    }) => {
      c ? h.style.setProperty(g, c) : h.style.removeProperty(g);
    });
  };
}
function fb(r) {
  const i = [];
  return [].forEach.call(r.children, (o) => {
    o.getAttribute("aria-hidden") === "true" && i.push(o);
  }), i;
}
class db {
  constructor() {
    this.modals = [], this.containers = [];
  }
  add(i, o) {
    let l = this.modals.indexOf(i);
    if (l !== -1)
      return l;
    l = this.modals.length, this.modals.push(i), i.modalRef && Er(i.modalRef, !1);
    const f = fb(o);
    Eu(o, i.mount, i.modalRef, f, !0);
    const c = fs(this.containers, (h) => h.container === o);
    return c !== -1 ? (this.containers[c].modals.push(i), l) : (this.containers.push({
      modals: [i],
      container: o,
      restore: null,
      hiddenSiblings: f
    }), l);
  }
  mount(i, o) {
    const l = fs(this.containers, (c) => c.modals.includes(i)), f = this.containers[l];
    f.restore || (f.restore = cb(f, o));
  }
  remove(i, o = !0) {
    const l = this.modals.indexOf(i);
    if (l === -1)
      return l;
    const f = fs(this.containers, (h) => h.modals.includes(i)), c = this.containers[f];
    if (c.modals.splice(c.modals.indexOf(i), 1), this.modals.splice(l, 1), c.modals.length === 0)
      c.restore && c.restore(), i.modalRef && Er(i.modalRef, o), Eu(c.container, i.mount, i.modalRef, c.hiddenSiblings, !1), this.containers.splice(f, 1);
    else {
      const h = c.modals[c.modals.length - 1];
      h.modalRef && Er(h.modalRef, !1);
    }
    return l;
  }
  isTopModal(i) {
    return this.modals.length > 0 && this.modals[this.modals.length - 1] === i;
  }
}
const pb = ["input", "select", "textarea", "a[href]", "button", "[tabindex]", "audio[controls]", "video[controls]", '[contenteditable]:not([contenteditable="false"])'].join(",");
function hb(r) {
  const i = parseInt(r.getAttribute("tabindex") || "", 10);
  return Number.isNaN(i) ? r.contentEditable === "true" || (r.nodeName === "AUDIO" || r.nodeName === "VIDEO" || r.nodeName === "DETAILS") && r.getAttribute("tabindex") === null ? 0 : r.tabIndex : i;
}
function gb(r) {
  if (r.tagName !== "INPUT" || r.type !== "radio" || !r.name)
    return !1;
  const i = (l) => r.ownerDocument.querySelector(`input[type="radio"]${l}`);
  let o = i(`[name="${r.name}"]:checked`);
  return o || (o = i(`[name="${r.name}"]`)), o !== r;
}
function mb(r) {
  return !(r.disabled || r.tagName === "INPUT" && r.type === "hidden" || gb(r));
}
function vb(r) {
  const i = [], o = [];
  return Array.from(r.querySelectorAll(pb)).forEach((l, f) => {
    const c = hb(l);
    c === -1 || !mb(l) || (c === 0 ? i.push(l) : o.push({
      documentOrder: f,
      tabIndex: c,
      node: l
    }));
  }), o.sort((l, f) => l.tabIndex === f.tabIndex ? l.documentOrder - f.documentOrder : l.tabIndex - f.tabIndex).map((l) => l.node).concat(i);
}
function yb() {
  return !0;
}
function Ao(r) {
  const {
    children: i,
    disableAutoFocus: o = !1,
    disableEnforceFocus: l = !1,
    disableRestoreFocus: f = !1,
    getTabbable: c = vb,
    isEnabled: h = yb,
    open: g
  } = r, y = C.useRef(!1), b = C.useRef(null), E = C.useRef(null), R = C.useRef(null), N = C.useRef(null), M = C.useRef(!1), A = C.useRef(null), k = Wn($o(i), A), z = C.useRef(null);
  C.useEffect(() => {
    !g || !A.current || (M.current = !o);
  }, [o, g]), C.useEffect(() => {
    if (!g || !A.current)
      return;
    const L = zn(A.current), D = yr(L);
    return A.current.contains(D) || (A.current.hasAttribute("tabIndex") || (process.env.NODE_ENV !== "production" && console.error(["MUI: The modal content node does not accept focus.", 'For the benefit of assistive technologies, the tabIndex of the node is being set to "-1".'].join(`
`)), A.current.setAttribute("tabIndex", "-1")), M.current && A.current.focus()), () => {
      f || (R.current && R.current.focus && (y.current = !0, R.current.focus()), R.current = null);
    };
  }, [g]), C.useEffect(() => {
    if (!g || !A.current)
      return;
    const L = zn(A.current), D = (W) => {
      if (z.current = W, l || !h() || W.key !== "Tab")
        return;
      yr(L) === A.current && W.shiftKey && (y.current = !0, E.current && E.current.focus());
    }, U = () => {
      const W = A.current;
      if (W === null)
        return;
      const G = yr(L);
      if (!L.hasFocus() || !h() || y.current) {
        y.current = !1;
        return;
      }
      if (W.contains(G) || l && G !== b.current && G !== E.current)
        return;
      if (G !== N.current)
        N.current = null;
      else if (N.current !== null)
        return;
      if (!M.current)
        return;
      let Z = [];
      if ((G === b.current || G === E.current) && (Z = c(A.current)), Z.length > 0) {
        const ge = !!(z.current?.shiftKey && z.current?.key === "Tab"), de = Z[0], se = Z[Z.length - 1];
        typeof de != "string" && typeof se != "string" && (ge ? se.focus() : de.focus());
      } else
        W.focus();
    };
    L.addEventListener("focusin", U), L.addEventListener("keydown", D, !0);
    const q = setInterval(() => {
      const W = yr(L);
      W && W.tagName === "BODY" && U();
    }, 50);
    return () => {
      clearInterval(q), L.removeEventListener("focusin", U), L.removeEventListener("keydown", D, !0);
    };
  }, [o, l, f, h, g, c]);
  const B = (L) => {
    R.current === null && (R.current = L.relatedTarget), M.current = !0, N.current = L.target;
    const D = i.props.onFocus;
    D && D(L);
  }, H = (L) => {
    R.current === null && (R.current = L.relatedTarget), M.current = !0;
  };
  return /* @__PURE__ */ fe(C.Fragment, {
    children: [/* @__PURE__ */ S("div", {
      tabIndex: g ? 0 : -1,
      onFocus: H,
      ref: b,
      "data-testid": "sentinelStart"
    }), /* @__PURE__ */ C.cloneElement(i, {
      ref: k,
      onFocus: B
    }), /* @__PURE__ */ S("div", {
      tabIndex: g ? 0 : -1,
      onFocus: H,
      ref: E,
      "data-testid": "sentinelEnd"
    })]
  });
}
process.env.NODE_ENV !== "production" && (Ao.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A single child content element.
   */
  children: Rr,
  /**
   * If `true`, the focus trap will not automatically shift focus to itself when it opens, and
   * replace it to the last focused element when it closes.
   * This also works correctly with any focus trap children that have the `disableAutoFocus` prop.
   *
   * Generally this should never be set to `true` as it makes the focus trap less
   * accessible to assistive technologies, like screen readers.
   * @default false
   */
  disableAutoFocus: a.bool,
  /**
   * If `true`, the focus trap will not prevent focus from leaving the focus trap while open.
   *
   * Generally this should never be set to `true` as it makes the focus trap less
   * accessible to assistive technologies, like screen readers.
   * @default false
   */
  disableEnforceFocus: a.bool,
  /**
   * If `true`, the focus trap will not restore focus to previously focused element once
   * focus trap is hidden or unmounted.
   * @default false
   */
  disableRestoreFocus: a.bool,
  /**
   * Returns an array of ordered tabbable nodes (i.e. in tab order) within the root.
   * For instance, you can provide the "tabbable" npm dependency.
   * @param {HTMLElement} root
   */
  getTabbable: a.func,
  /**
   * This prop extends the `open` prop.
   * It allows to toggle the open state without having to wait for a rerender when changing the `open` prop.
   * This prop should be memoized.
   * It can be used to support multiple focus trap mounted at the same time.
   * @default function defaultIsEnabled(): boolean {
   *   return true;
   * }
   */
  isEnabled: a.func,
  /**
   * If `true`, focus is locked.
   */
  open: a.bool.isRequired
});
process.env.NODE_ENV !== "production" && (Ao.propTypes = Zu(Ao.propTypes));
function bb(r) {
  return typeof r == "function" ? r() : r;
}
const No = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const {
    children: l,
    container: f,
    disablePortal: c = !1
  } = i, [h, g] = C.useState(null), y = Wn(/* @__PURE__ */ C.isValidElement(l) ? $o(l) : null, o);
  if (Ro(() => {
    c || g(bb(f) || document.body);
  }, [f, c]), Ro(() => {
    if (h && !c)
      return mu(o, h), () => {
        mu(o, null);
      };
  }, [o, h, c]), c) {
    if (/* @__PURE__ */ C.isValidElement(l)) {
      const b = {
        ref: y
      };
      return /* @__PURE__ */ C.cloneElement(l, b);
    }
    return l;
  }
  return h && /* @__PURE__ */ q0.createPortal(l, h);
});
process.env.NODE_ENV !== "production" && (No.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The children to render into the `container`.
   */
  children: a.node,
  /**
   * An HTML element or function that returns one.
   * The `container` will have the portal children appended to it.
   *
   * You can also provide a callback, which is called in a React layout effect.
   * This lets you set the container from a ref, and also makes server-side rendering possible.
   *
   * By default, it uses the body of the top-level document object,
   * so it's simply `document.body` most of the time.
   */
  container: a.oneOfType([Sr, a.func]),
  /**
   * The `children` will be under the DOM hierarchy of the parent component.
   * @default false
   */
  disablePortal: a.bool
});
process.env.NODE_ENV !== "production" && (No.propTypes = Zu(No.propTypes));
function tt(r, i) {
  const {
    className: o,
    elementType: l,
    ownerState: f,
    externalForwardedProps: c,
    internalForwardedProps: h,
    shouldForwardComponentProp: g = !1,
    ...y
  } = i, {
    component: b,
    slots: E = {
      [r]: void 0
    },
    slotProps: R = {
      [r]: void 0
    },
    ...N
  } = c, M = E[r] || l, A = lc(R[r], f), {
    props: {
      component: k,
      ...z
    },
    internalRef: B
  } = ac({
    className: o,
    ...y,
    externalForwardedProps: r === "root" ? N : void 0,
    externalSlotProps: A
  }), H = Wn(B, A?.ref, i.ref), L = r === "root" ? k || b : k, D = ic(M, {
    ...r === "root" && !b && !E[r] && h,
    ...r !== "root" && !E[r] && h,
    ...z,
    ...L && !g && {
      as: L
    },
    ...L && g && {
      component: L
    },
    ref: H
  }, f);
  return [M, D];
}
const xb = {
  entering: {
    opacity: 1
  },
  entered: {
    opacity: 1
  }
}, Tc = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const l = Cr(), f = {
    enter: l.transitions.duration.enteringScreen,
    exit: l.transitions.duration.leavingScreen
  }, {
    addEndListener: c,
    appear: h = !0,
    children: g,
    easing: y,
    in: b,
    onEnter: E,
    onEntered: R,
    onEntering: N,
    onExit: M,
    onExited: A,
    onExiting: k,
    style: z,
    timeout: B = f,
    // eslint-disable-next-line react/prop-types
    TransitionComponent: H = Un,
    ...L
  } = i, D = C.useRef(null), U = Wn(D, $o(g), o), q = (te) => ($) => {
    if (te) {
      const K = D.current;
      $ === void 0 ? te(K) : te(K, $);
    }
  }, W = q(N), G = q((te, $) => {
    Sc(te);
    const K = Po({
      style: z,
      timeout: B,
      easing: y
    }, {
      mode: "enter"
    });
    te.style.webkitTransition = l.transitions.create("opacity", K), te.style.transition = l.transitions.create("opacity", K), E && E(te, $);
  }), Z = q(R), ge = q(k), de = q((te) => {
    const $ = Po({
      style: z,
      timeout: B,
      easing: y
    }, {
      mode: "exit"
    });
    te.style.webkitTransition = l.transitions.create("opacity", $), te.style.transition = l.transitions.create("opacity", $), M && M(te);
  }), se = q(A);
  return /* @__PURE__ */ S(H, {
    appear: h,
    in: b,
    nodeRef: D,
    onEnter: G,
    onEntered: Z,
    onEntering: W,
    onExit: de,
    onExited: se,
    onExiting: ge,
    addEndListener: (te) => {
      c && c(D.current, te);
    },
    timeout: B,
    ...L,
    children: (te, {
      ownerState: $,
      ...K
    }) => /* @__PURE__ */ C.cloneElement(g, {
      style: {
        opacity: 0,
        visibility: te === "exited" && !b ? "hidden" : void 0,
        ...xb[te],
        ...z,
        ...g.props.style
      },
      ref: U,
      ...K
    })
  });
});
process.env.NODE_ENV !== "production" && (Tc.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Add a custom transition end trigger. Called with the transitioning DOM
   * node and a done callback. Allows for more fine grained transition end
   * logic. Note: Timeouts are still used as a fallback if provided.
   */
  addEndListener: a.func,
  /**
   * Perform the enter transition when it first mounts if `in` is also `true`.
   * Set this to `false` to disable this behavior.
   * @default true
   */
  appear: a.bool,
  /**
   * A single child content element.
   */
  children: Rr.isRequired,
  /**
   * The transition timing function.
   * You may specify a single easing or a object containing enter and exit values.
   */
  easing: a.oneOfType([a.shape({
    enter: a.string,
    exit: a.string
  }), a.string]),
  /**
   * If `true`, the component will transition in.
   */
  in: a.bool,
  /**
   * @ignore
   */
  onEnter: a.func,
  /**
   * @ignore
   */
  onEntered: a.func,
  /**
   * @ignore
   */
  onEntering: a.func,
  /**
   * @ignore
   */
  onExit: a.func,
  /**
   * @ignore
   */
  onExited: a.func,
  /**
   * @ignore
   */
  onExiting: a.func,
  /**
   * @ignore
   */
  style: a.object,
  /**
   * The duration for the transition, in milliseconds.
   * You may specify a single timeout for all transitions, or individually with an object.
   * @default {
   *   enter: theme.transitions.duration.enteringScreen,
   *   exit: theme.transitions.duration.leavingScreen,
   * }
   */
  timeout: a.oneOfType([a.number, a.shape({
    appear: a.number,
    enter: a.number,
    exit: a.number
  })])
});
function _b(r) {
  return _n("MuiBackdrop", r);
}
wn("MuiBackdrop", ["root", "invisible"]);
const wb = (r) => {
  const {
    classes: i,
    invisible: o
  } = r;
  return Dn({
    root: ["root", o && "invisible"]
  }, _b, i);
}, Eb = Pe("div", {
  name: "MuiBackdrop",
  slot: "Root",
  overridesResolver: (r, i) => {
    const {
      ownerState: o
    } = r;
    return [i.root, o.invisible && i.invisible];
  }
})({
  position: "fixed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  right: 0,
  bottom: 0,
  top: 0,
  left: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  WebkitTapHighlightColor: "transparent",
  variants: [{
    props: {
      invisible: !0
    },
    style: {
      backgroundColor: "transparent"
    }
  }]
}), Cc = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const l = En({
    props: i,
    name: "MuiBackdrop"
  }), {
    children: f,
    className: c,
    component: h = "div",
    invisible: g = !1,
    open: y,
    components: b = {},
    componentsProps: E = {},
    slotProps: R = {},
    slots: N = {},
    TransitionComponent: M,
    transitionDuration: A,
    ...k
  } = l, z = {
    ...l,
    component: h,
    invisible: g
  }, B = wb(z), H = {
    transition: M,
    root: b.Root,
    ...N
  }, L = {
    ...E,
    ...R
  }, D = {
    component: h,
    slots: H,
    slotProps: L
  }, [U, q] = tt("root", {
    elementType: Eb,
    externalForwardedProps: D,
    className: Te(B.root, c),
    ownerState: z
  }), [W, G] = tt("transition", {
    elementType: Tc,
    externalForwardedProps: D,
    ownerState: z
  });
  return /* @__PURE__ */ S(W, {
    in: y,
    timeout: A,
    ...k,
    ...G,
    children: /* @__PURE__ */ S(U, {
      "aria-hidden": !0,
      ...q,
      ref: o,
      children: f
    })
  });
});
process.env.NODE_ENV !== "production" && (Cc.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: a.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: a.object,
  /**
   * @ignore
   */
  className: a.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: a.elementType,
  /**
   * The components used for each slot inside.
   *
   * @deprecated Use the `slots` prop instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   *
   * @default {}
   */
  components: a.shape({
    Root: a.elementType
  }),
  /**
   * The extra props for the slot components.
   * You can override the existing props or add new ones.
   *
   * @deprecated Use the `slotProps` prop instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   *
   * @default {}
   */
  componentsProps: a.shape({
    root: a.object
  }),
  /**
   * If `true`, the backdrop is invisible.
   * It can be used when rendering a popover or a custom select component.
   * @default false
   */
  invisible: a.bool,
  /**
   * If `true`, the component is shown.
   */
  open: a.bool.isRequired,
  /**
   * The props used for each slot inside.
   * @default {}
   */
  slotProps: a.shape({
    root: a.oneOfType([a.func, a.object]),
    transition: a.oneOfType([a.func, a.object])
  }),
  /**
   * The components used for each slot inside.
   * @default {}
   */
  slots: a.shape({
    root: a.elementType,
    transition: a.elementType
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: a.oneOfType([a.arrayOf(a.oneOfType([a.func, a.object, a.bool])), a.func, a.object]),
  /**
   * The component used for the transition.
   * [Follow this guide](https://mui.com/material-ui/transitions/#transitioncomponent-prop) to learn more about the requirements for this component.
   * @default Fade
   * @deprecated Use `slots.transition` instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   */
  TransitionComponent: a.elementType,
  /**
   * The duration for the transition, in milliseconds.
   * You may specify a single timeout for all transitions, or individually with an object.
   */
  transitionDuration: a.oneOfType([a.number, a.shape({
    appear: a.number,
    enter: a.number,
    exit: a.number
  })])
});
function Sb(r) {
  return typeof r == "function" ? r() : r;
}
function Tb(r) {
  return r ? r.props.hasOwnProperty("in") : !1;
}
const Su = () => {
}, xo = new db();
function Cb(r) {
  const {
    container: i,
    disableEscapeKeyDown: o = !1,
    disableScrollLock: l = !1,
    closeAfterTransition: f = !1,
    onTransitionEnter: c,
    onTransitionExited: h,
    children: g,
    onClose: y,
    open: b,
    rootRef: E
  } = r, R = C.useRef({}), N = C.useRef(null), M = C.useRef(null), A = Wn(M, E), [k, z] = C.useState(!b), B = Tb(g);
  let H = !0;
  (r["aria-hidden"] === "false" || r["aria-hidden"] === !1) && (H = !1);
  const L = () => zn(N.current), D = () => (R.current.modalRef = M.current, R.current.mount = N.current, R.current), U = () => {
    xo.mount(D(), {
      disableScrollLock: l
    }), M.current && (M.current.scrollTop = 0);
  }, q = Zt(() => {
    const $ = Sb(i) || L().body;
    xo.add(D(), $), M.current && U();
  }), W = () => xo.isTopModal(D()), G = Zt(($) => {
    N.current = $, $ && (b && W() ? U() : M.current && Er(M.current, H));
  }), Z = C.useCallback(() => {
    xo.remove(D(), H);
  }, [H]);
  C.useEffect(() => () => {
    Z();
  }, [Z]), C.useEffect(() => {
    b ? q() : (!B || !f) && Z();
  }, [b, Z, B, f, q]);
  const ge = ($) => (K) => {
    $.onKeyDown?.(K), !(K.key !== "Escape" || K.which === 229 || // Wait until IME is settled.
    !W()) && (o || (K.stopPropagation(), y && y(K, "escapeKeyDown")));
  }, de = ($) => (K) => {
    $.onClick?.(K), K.target === K.currentTarget && y && y(K, "backdropClick");
  };
  return {
    getRootProps: ($ = {}) => {
      const K = sc(r);
      delete K.onTransitionEnter, delete K.onTransitionExited;
      const le = {
        ...K,
        ...$
      };
      return {
        /*
         * Marking an element with the role presentation indicates to assistive technology
         * that this element should be ignored; it exists to support the web application and
         * is not meant for humans to interact with directly.
         * https://github.com/evcohen/eslint-plugin-jsx-a11y/blob/master/docs/rules/no-static-element-interactions.md
         */
        role: "presentation",
        ...le,
        onKeyDown: ge(le),
        ref: A
      };
    },
    getBackdropProps: ($ = {}) => {
      const K = $;
      return {
        "aria-hidden": !0,
        ...K,
        onClick: de(K),
        open: b
      };
    },
    getTransitionProps: () => {
      const $ = () => {
        z(!1), c && c();
      }, K = () => {
        z(!0), h && h(), f && Z();
      };
      return {
        onEnter: gu($, g?.props.onEnter ?? Su),
        onExited: gu(K, g?.props.onExited ?? Su)
      };
    },
    rootRef: A,
    portalRef: G,
    isTopModal: W,
    exited: k,
    hasTransition: B
  };
}
function Rb(r) {
  return _n("MuiModal", r);
}
wn("MuiModal", ["root", "hidden", "backdrop"]);
const Ib = (r) => {
  const {
    open: i,
    exited: o,
    classes: l
  } = r;
  return Dn({
    root: ["root", !i && o && "hidden"],
    backdrop: ["backdrop"]
  }, Rb, l);
}, Ob = Pe("div", {
  name: "MuiModal",
  slot: "Root",
  overridesResolver: (r, i) => {
    const {
      ownerState: o
    } = r;
    return [i.root, !o.open && o.exited && i.hidden];
  }
})(rt(({
  theme: r
}) => ({
  position: "fixed",
  zIndex: (r.vars || r).zIndex.modal,
  right: 0,
  bottom: 0,
  top: 0,
  left: 0,
  variants: [{
    props: ({
      ownerState: i
    }) => !i.open && i.exited,
    style: {
      visibility: "hidden"
    }
  }]
}))), Pb = Pe(Cc, {
  name: "MuiModal",
  slot: "Backdrop"
})({
  zIndex: -1
}), Rc = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const l = En({
    name: "MuiModal",
    props: i
  }), {
    BackdropComponent: f = Pb,
    BackdropProps: c,
    classes: h,
    className: g,
    closeAfterTransition: y = !1,
    children: b,
    container: E,
    component: R,
    components: N = {},
    componentsProps: M = {},
    disableAutoFocus: A = !1,
    disableEnforceFocus: k = !1,
    disableEscapeKeyDown: z = !1,
    disablePortal: B = !1,
    disableRestoreFocus: H = !1,
    disableScrollLock: L = !1,
    hideBackdrop: D = !1,
    keepMounted: U = !1,
    onClose: q,
    onTransitionEnter: W,
    onTransitionExited: G,
    open: Z,
    slotProps: ge = {},
    slots: de = {},
    // eslint-disable-next-line react/prop-types
    theme: se,
    ...re
  } = l, te = {
    ...l,
    closeAfterTransition: y,
    disableAutoFocus: A,
    disableEnforceFocus: k,
    disableEscapeKeyDown: z,
    disablePortal: B,
    disableRestoreFocus: H,
    disableScrollLock: L,
    hideBackdrop: D,
    keepMounted: U
  }, {
    getRootProps: $,
    getBackdropProps: K,
    getTransitionProps: le,
    portalRef: Ce,
    isTopModal: X,
    exited: we,
    hasTransition: Me
  } = Cb({
    ...te,
    rootRef: o
  }), je = {
    ...te,
    exited: we
  }, Hn = Ib(je), Sn = {};
  if (b.props.tabIndex === void 0 && (Sn.tabIndex = "-1"), Me) {
    const {
      onEnter: ve,
      onExited: ye
    } = le();
    Sn.onEnter = ve, Sn.onExited = ye;
  }
  const rn = {
    slots: {
      root: N.Root,
      backdrop: N.Backdrop,
      ...de
    },
    slotProps: {
      ...M,
      ...ge
    }
  }, [kn, ht] = tt("root", {
    ref: o,
    elementType: Ob,
    externalForwardedProps: {
      ...rn,
      ...re,
      component: R
    },
    getSlotProps: $,
    ownerState: je,
    className: Te(g, Hn?.root, !je.open && je.exited && Hn?.hidden)
  }), [Tn, Cn] = tt("backdrop", {
    ref: c?.ref,
    elementType: f,
    externalForwardedProps: rn,
    shouldForwardComponentProp: !0,
    additionalProps: c,
    getSlotProps: (ve) => K({
      ...ve,
      onClick: (ye) => {
        ve?.onClick && ve.onClick(ye);
      }
    }),
    className: Te(c?.className, Hn?.backdrop),
    ownerState: je
  });
  return !U && !Z && (!Me || we) ? null : /* @__PURE__ */ S(No, {
    ref: Ce,
    container: E,
    disablePortal: B,
    children: /* @__PURE__ */ fe(kn, {
      ...ht,
      children: [!D && f ? /* @__PURE__ */ S(Tn, {
        ...Cn
      }) : null, /* @__PURE__ */ S(Ao, {
        disableEnforceFocus: k,
        disableAutoFocus: A,
        disableRestoreFocus: H,
        isEnabled: X,
        open: Z,
        children: /* @__PURE__ */ C.cloneElement(b, Sn)
      })]
    })
  });
});
process.env.NODE_ENV !== "production" && (Rc.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A backdrop component. This prop enables custom backdrop rendering.
   * @deprecated Use `slots.backdrop` instead. While this prop currently works, it will be removed in the next major version.
   * Use the `slots.backdrop` prop to make your application ready for the next version of Material UI.
   * @default styled(Backdrop, {
   *   name: 'MuiModal',
   *   slot: 'Backdrop',
   * })({
   *   zIndex: -1,
   * })
   */
  BackdropComponent: a.elementType,
  /**
   * Props applied to the [`Backdrop`](https://mui.com/material-ui/api/backdrop/) element.
   * @deprecated Use `slotProps.backdrop` instead.
   */
  BackdropProps: a.object,
  /**
   * A single child content element.
   */
  children: Rr.isRequired,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: a.object,
  /**
   * @ignore
   */
  className: a.string,
  /**
   * When set to true the Modal waits until a nested Transition is completed before closing.
   * @default false
   */
  closeAfterTransition: a.bool,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: a.elementType,
  /**
   * The components used for each slot inside.
   *
   * @deprecated Use the `slots` prop instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   *
   * @default {}
   */
  components: a.shape({
    Backdrop: a.elementType,
    Root: a.elementType
  }),
  /**
   * The extra props for the slot components.
   * You can override the existing props or add new ones.
   *
   * @deprecated Use the `slotProps` prop instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   *
   * @default {}
   */
  componentsProps: a.shape({
    backdrop: a.oneOfType([a.func, a.object]),
    root: a.oneOfType([a.func, a.object])
  }),
  /**
   * An HTML element or function that returns one.
   * The `container` will have the portal children appended to it.
   *
   * You can also provide a callback, which is called in a React layout effect.
   * This lets you set the container from a ref, and also makes server-side rendering possible.
   *
   * By default, it uses the body of the top-level document object,
   * so it's simply `document.body` most of the time.
   */
  container: a.oneOfType([Sr, a.func]),
  /**
   * If `true`, the modal will not automatically shift focus to itself when it opens, and
   * replace it to the last focused element when it closes.
   * This also works correctly with any modal children that have the `disableAutoFocus` prop.
   *
   * Generally this should never be set to `true` as it makes the modal less
   * accessible to assistive technologies, like screen readers.
   * @default false
   */
  disableAutoFocus: a.bool,
  /**
   * If `true`, the modal will not prevent focus from leaving the modal while open.
   *
   * Generally this should never be set to `true` as it makes the modal less
   * accessible to assistive technologies, like screen readers.
   * @default false
   */
  disableEnforceFocus: a.bool,
  /**
   * If `true`, hitting escape will not fire the `onClose` callback.
   * @default false
   */
  disableEscapeKeyDown: a.bool,
  /**
   * The `children` will be under the DOM hierarchy of the parent component.
   * @default false
   */
  disablePortal: a.bool,
  /**
   * If `true`, the modal will not restore focus to previously focused element once
   * modal is hidden or unmounted.
   * @default false
   */
  disableRestoreFocus: a.bool,
  /**
   * Disable the scroll lock behavior.
   * @default false
   */
  disableScrollLock: a.bool,
  /**
   * If `true`, the backdrop is not rendered.
   * @default false
   */
  hideBackdrop: a.bool,
  /**
   * Always keep the children in the DOM.
   * This prop can be useful in SEO situation or
   * when you want to maximize the responsiveness of the Modal.
   * @default false
   */
  keepMounted: a.bool,
  /**
   * Callback fired when the component requests to be closed.
   * The `reason` parameter can optionally be used to control the response to `onClose`.
   *
   * @param {object} event The event source of the callback.
   * @param {string} reason Can be: `"escapeKeyDown"`, `"backdropClick"`.
   */
  onClose: a.func,
  /**
   * A function called when a transition enters.
   */
  onTransitionEnter: a.func,
  /**
   * A function called when a transition has exited.
   */
  onTransitionExited: a.func,
  /**
   * If `true`, the component is shown.
   */
  open: a.bool.isRequired,
  /**
   * The props used for each slot inside the Modal.
   * @default {}
   */
  slotProps: a.shape({
    backdrop: a.oneOfType([a.func, a.object]),
    root: a.oneOfType([a.func, a.object])
  }),
  /**
   * The components used for each slot inside the Modal.
   * Either a string to use a HTML element or a component.
   * @default {}
   */
  slots: a.shape({
    backdrop: a.elementType,
    root: a.elementType
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: a.oneOfType([a.arrayOf(a.oneOfType([a.func, a.object, a.bool])), a.func, a.object])
});
function Mb(r) {
  return _n("MuiPaper", r);
}
wn("MuiPaper", ["root", "rounded", "outlined", "elevation", "elevation0", "elevation1", "elevation2", "elevation3", "elevation4", "elevation5", "elevation6", "elevation7", "elevation8", "elevation9", "elevation10", "elevation11", "elevation12", "elevation13", "elevation14", "elevation15", "elevation16", "elevation17", "elevation18", "elevation19", "elevation20", "elevation21", "elevation22", "elevation23", "elevation24"]);
const Ab = (r) => {
  const {
    square: i,
    elevation: o,
    variant: l,
    classes: f
  } = r, c = {
    root: ["root", l, !i && "rounded", l === "elevation" && `elevation${o}`]
  };
  return Dn(c, Mb, f);
}, Nb = Pe("div", {
  name: "MuiPaper",
  slot: "Root",
  overridesResolver: (r, i) => {
    const {
      ownerState: o
    } = r;
    return [i.root, i[o.variant], !o.square && i.rounded, o.variant === "elevation" && i[`elevation${o.elevation}`]];
  }
})(rt(({
  theme: r
}) => ({
  backgroundColor: (r.vars || r).palette.background.paper,
  color: (r.vars || r).palette.text.primary,
  transition: r.transitions.create("box-shadow"),
  variants: [{
    props: ({
      ownerState: i
    }) => !i.square,
    style: {
      borderRadius: r.shape.borderRadius
    }
  }, {
    props: {
      variant: "outlined"
    },
    style: {
      border: `1px solid ${(r.vars || r).palette.divider}`
    }
  }, {
    props: {
      variant: "elevation"
    },
    style: {
      boxShadow: "var(--Paper-shadow)",
      backgroundImage: "var(--Paper-overlay)"
    }
  }]
}))), Ic = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const l = En({
    props: i,
    name: "MuiPaper"
  }), f = Cr(), {
    className: c,
    component: h = "div",
    elevation: g = 1,
    square: y = !1,
    variant: b = "elevation",
    ...E
  } = l, R = {
    ...l,
    component: h,
    elevation: g,
    square: y,
    variant: b
  }, N = Ab(R);
  return process.env.NODE_ENV !== "production" && f.shadows[g] === void 0 && console.error([`MUI: The elevation provided <Paper elevation={${g}}> is not available in the theme.`, `Please make sure that \`theme.shadows[${g}]\` is defined.`].join(`
`)), /* @__PURE__ */ S(Nb, {
    as: h,
    ownerState: R,
    className: Te(N.root, c),
    ref: o,
    ...E,
    style: {
      ...b === "elevation" && {
        "--Paper-shadow": (f.vars || f).shadows[g],
        ...f.vars && {
          "--Paper-overlay": f.vars.overlays?.[g]
        },
        ...!f.vars && f.palette.mode === "dark" && {
          "--Paper-overlay": `linear-gradient(${iu("#fff", su(g))}, ${iu("#fff", su(g))})`
        }
      },
      ...E.style
    }
  });
});
process.env.NODE_ENV !== "production" && (Ic.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: a.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: a.object,
  /**
   * @ignore
   */
  className: a.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: a.elementType,
  /**
   * Shadow depth, corresponds to `dp` in the spec.
   * It accepts values between 0 and 24 inclusive.
   * @default 1
   */
  elevation: Mt(yc, (r) => {
    const {
      elevation: i,
      variant: o
    } = r;
    return i > 0 && o === "outlined" ? new Error(`MUI: Combining \`elevation={${i}}\` with \`variant="${o}"\` has no effect. Either use \`elevation={0}\` or use a different \`variant\`.`) : null;
  }),
  /**
   * If `true`, rounded corners are disabled.
   * @default false
   */
  square: a.bool,
  /**
   * @ignore
   */
  style: a.object,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: a.oneOfType([a.arrayOf(a.oneOfType([a.func, a.object, a.bool])), a.func, a.object]),
  /**
   * The variant to use.
   * @default 'elevation'
   */
  variant: a.oneOfType([a.oneOf(["elevation", "outlined"]), a.string])
});
function Lb(r) {
  return _n("MuiPopover", r);
}
wn("MuiPopover", ["root", "paper"]);
function Tu(r, i) {
  let o = 0;
  return typeof i == "number" ? o = i : i === "center" ? o = r.height / 2 : i === "bottom" && (o = r.height), o;
}
function Cu(r, i) {
  let o = 0;
  return typeof i == "number" ? o = i : i === "center" ? o = r.width / 2 : i === "right" && (o = r.width), o;
}
function Ru(r) {
  return [r.horizontal, r.vertical].map((i) => typeof i == "number" ? `${i}px` : i).join(" ");
}
function xr(r) {
  return typeof r == "function" ? r() : r;
}
const Db = (r) => {
  const {
    classes: i
  } = r;
  return Dn({
    root: ["root"],
    paper: ["paper"]
  }, Lb, i);
}, kb = Pe(Rc, {
  name: "MuiPopover",
  slot: "Root"
})({}), Oc = Pe(Ic, {
  name: "MuiPopover",
  slot: "Paper"
})({
  position: "absolute",
  overflowY: "auto",
  overflowX: "hidden",
  // So we see the popover when it's empty.
  // It's most likely on issue on userland.
  minWidth: 16,
  minHeight: 16,
  maxWidth: "calc(100% - 32px)",
  maxHeight: "calc(100% - 32px)",
  // We disable the focus ring for mouse, touch and keyboard users.
  outline: 0
}), Pc = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const l = En({
    props: i,
    name: "MuiPopover"
  }), {
    action: f,
    anchorEl: c,
    anchorOrigin: h = {
      vertical: "top",
      horizontal: "left"
    },
    anchorPosition: g,
    anchorReference: y = "anchorEl",
    children: b,
    className: E,
    container: R,
    elevation: N = 8,
    marginThreshold: M = 16,
    open: A,
    PaperProps: k = {},
    // TODO: remove in v7
    slots: z = {},
    slotProps: B = {},
    transformOrigin: H = {
      vertical: "top",
      horizontal: "left"
    },
    TransitionComponent: L,
    // TODO: remove in v7
    transitionDuration: D = "auto",
    TransitionProps: U = {},
    // TODO: remove in v7
    disableScrollLock: q = !1,
    ...W
  } = l, G = C.useRef(), Z = {
    ...l,
    anchorOrigin: h,
    anchorReference: y,
    elevation: N,
    marginThreshold: M,
    transformOrigin: H,
    TransitionComponent: L,
    transitionDuration: D,
    TransitionProps: U
  }, ge = Db(Z), de = C.useCallback(() => {
    if (y === "anchorPosition")
      return process.env.NODE_ENV !== "production" && (g || console.error('MUI: You need to provide a `anchorPosition` prop when using <Popover anchorReference="anchorPosition" />.')), g;
    const ve = xr(c), ye = ve && ve.nodeType === 1 ? ve : zn(G.current).body, Le = ye.getBoundingClientRect();
    if (process.env.NODE_ENV !== "production") {
      const fn = ye.getBoundingClientRect();
      process.env.NODE_ENV !== "test" && fn.top === 0 && fn.left === 0 && fn.right === 0 && fn.bottom === 0 && console.warn(["MUI: The `anchorEl` prop provided to the component is invalid.", "The anchor element should be part of the document layout.", "Make sure the element is present in the document or that it's not display none."].join(`
`));
    }
    return {
      top: Le.top + Tu(Le, h.vertical),
      left: Le.left + Cu(Le, h.horizontal)
    };
  }, [c, h.horizontal, h.vertical, g, y]), se = C.useCallback((ve) => ({
    vertical: Tu(ve, H.vertical),
    horizontal: Cu(ve, H.horizontal)
  }), [H.horizontal, H.vertical]), re = C.useCallback((ve) => {
    const ye = {
      width: ve.offsetWidth,
      height: ve.offsetHeight
    }, Le = se(ye);
    if (y === "none")
      return {
        top: null,
        left: null,
        transformOrigin: Ru(Le)
      };
    const fn = de();
    let De = fn.top - Le.vertical, Je = fn.left - Le.horizontal;
    const At = De + ye.height, He = Je + ye.width, Rn = Pt(xr(c)), Vn = Rn.innerHeight - M, In = Rn.innerWidth - M;
    if (M !== null && De < M) {
      const Ie = De - M;
      De -= Ie, Le.vertical += Ie;
    } else if (M !== null && At > Vn) {
      const Ie = At - Vn;
      De -= Ie, Le.vertical += Ie;
    }
    if (process.env.NODE_ENV !== "production" && ye.height > Vn && ye.height && Vn && console.error(["MUI: The popover component is too tall.", `Some part of it can not be seen on the screen (${ye.height - Vn}px).`, "Please consider adding a `max-height` to improve the user-experience."].join(`
`)), M !== null && Je < M) {
      const Ie = Je - M;
      Je -= Ie, Le.horizontal += Ie;
    } else if (He > In) {
      const Ie = He - In;
      Je -= Ie, Le.horizontal += Ie;
    }
    return {
      top: `${Math.round(De)}px`,
      left: `${Math.round(Je)}px`,
      transformOrigin: Ru(Le)
    };
  }, [c, y, de, se, M]), [te, $] = C.useState(A), K = C.useCallback(() => {
    const ve = G.current;
    if (!ve)
      return;
    const ye = re(ve);
    ye.top !== null && ve.style.setProperty("top", ye.top), ye.left !== null && (ve.style.left = ye.left), ve.style.transformOrigin = ye.transformOrigin, $(!0);
  }, [re]);
  C.useEffect(() => (q && window.addEventListener("scroll", K), () => window.removeEventListener("scroll", K)), [c, q, K]);
  const le = () => {
    K();
  }, Ce = () => {
    $(!1);
  };
  C.useEffect(() => {
    A && K();
  }), C.useImperativeHandle(f, () => A ? {
    updatePosition: () => {
      K();
    }
  } : null, [A, K]), C.useEffect(() => {
    if (!A)
      return;
    const ve = Ly(() => {
      K();
    }), ye = Pt(xr(c));
    return ye.addEventListener("resize", ve), () => {
      ve.clear(), ye.removeEventListener("resize", ve);
    };
  }, [c, A, K]);
  let X = D;
  const we = {
    slots: {
      transition: L,
      ...z
    },
    slotProps: {
      transition: U,
      paper: k,
      ...B
    }
  }, [Me, je] = tt("transition", {
    elementType: Mo,
    externalForwardedProps: we,
    ownerState: Z,
    getSlotProps: (ve) => ({
      ...ve,
      onEntering: (ye, Le) => {
        ve.onEntering?.(ye, Le), le();
      },
      onExited: (ye) => {
        ve.onExited?.(ye), Ce();
      }
    }),
    additionalProps: {
      appear: !0,
      in: A
    }
  });
  D === "auto" && !Me.muiSupportAuto && (X = void 0);
  const Hn = R || (c ? zn(xr(c)).body : void 0), [Sn, {
    slots: rn,
    slotProps: kn,
    ...ht
  }] = tt("root", {
    ref: o,
    elementType: kb,
    externalForwardedProps: {
      ...we,
      ...W
    },
    shouldForwardComponentProp: !0,
    additionalProps: {
      slots: {
        backdrop: z.backdrop
      },
      slotProps: {
        backdrop: ky(typeof B.backdrop == "function" ? B.backdrop(Z) : B.backdrop, {
          invisible: !0
        })
      },
      container: Hn,
      open: A
    },
    ownerState: Z,
    className: Te(ge.root, E)
  }), [Tn, Cn] = tt("paper", {
    ref: G,
    className: ge.paper,
    elementType: Oc,
    externalForwardedProps: we,
    shouldForwardComponentProp: !0,
    additionalProps: {
      elevation: N,
      style: te ? void 0 : {
        opacity: 0
      }
    },
    ownerState: Z
  });
  return /* @__PURE__ */ S(Sn, {
    ...ht,
    ...!oc(Sn) && {
      slots: rn,
      slotProps: kn,
      disableScrollLock: q
    },
    children: /* @__PURE__ */ S(Me, {
      ...je,
      timeout: X,
      children: /* @__PURE__ */ S(Tn, {
        ...Cn,
        children: b
      })
    })
  });
});
process.env.NODE_ENV !== "production" && (Pc.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A ref for imperative actions.
   * It currently only supports updatePosition() action.
   */
  action: hc,
  /**
   * An HTML element, [PopoverVirtualElement](https://mui.com/material-ui/react-popover/#virtual-element),
   * or a function that returns either.
   * It's used to set the position of the popover.
   */
  anchorEl: Mt(a.oneOfType([Sr, a.func]), (r) => {
    if (r.open && (!r.anchorReference || r.anchorReference === "anchorEl")) {
      const i = xr(r.anchorEl);
      if (i && i.nodeType === 1) {
        const o = i.getBoundingClientRect();
        if (process.env.NODE_ENV !== "test" && o.top === 0 && o.left === 0 && o.right === 0 && o.bottom === 0)
          return new Error(["MUI: The `anchorEl` prop provided to the component is invalid.", "The anchor element should be part of the document layout.", "Make sure the element is present in the document or that it's not display none."].join(`
`));
      } else
        return new Error(["MUI: The `anchorEl` prop provided to the component is invalid.", `It should be an Element or PopoverVirtualElement instance but it's \`${i}\` instead.`].join(`
`));
    }
    return null;
  }),
  /**
   * This is the point on the anchor where the popover's
   * `anchorEl` will attach to. This is not used when the
   * anchorReference is 'anchorPosition'.
   *
   * Options:
   * vertical: [top, center, bottom];
   * horizontal: [left, center, right].
   * @default {
   *   vertical: 'top',
   *   horizontal: 'left',
   * }
   */
  anchorOrigin: a.shape({
    horizontal: a.oneOfType([a.oneOf(["center", "left", "right"]), a.number]).isRequired,
    vertical: a.oneOfType([a.oneOf(["bottom", "center", "top"]), a.number]).isRequired
  }),
  /**
   * This is the position that may be used to set the position of the popover.
   * The coordinates are relative to the application's client area.
   */
  anchorPosition: a.shape({
    left: a.number.isRequired,
    top: a.number.isRequired
  }),
  /**
   * This determines which anchor prop to refer to when setting
   * the position of the popover.
   * @default 'anchorEl'
   */
  anchorReference: a.oneOf(["anchorEl", "anchorPosition", "none"]),
  /**
   * A backdrop component. This prop enables custom backdrop rendering.
   * @deprecated Use `slots.backdrop` instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   * @default styled(Backdrop, {
   *   name: 'MuiModal',
   *   slot: 'Backdrop',
   *   overridesResolver: (props, styles) => {
   *     return styles.backdrop;
   *   },
   * })({
   *   zIndex: -1,
   * })
   */
  BackdropComponent: a.elementType,
  /**
   * Props applied to the [`Backdrop`](/material-ui/api/backdrop/) element.
   * @deprecated Use `slotProps.backdrop` instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   */
  BackdropProps: a.object,
  /**
   * The content of the component.
   */
  children: a.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: a.object,
  /**
   * @ignore
   */
  className: a.string,
  /**
   * An HTML element, component instance, or function that returns either.
   * The `container` will passed to the Modal component.
   *
   * By default, it uses the body of the anchorEl's top-level document object,
   * so it's simply `document.body` most of the time.
   */
  container: a.oneOfType([Sr, a.func]),
  /**
   * Disable the scroll lock behavior.
   * @default false
   */
  disableScrollLock: a.bool,
  /**
   * The elevation of the popover.
   * @default 8
   */
  elevation: yc,
  /**
   * Specifies how close to the edge of the window the popover can appear.
   * If null, the popover will not be constrained by the window.
   * @default 16
   */
  marginThreshold: a.number,
  /**
   * Callback fired when the component requests to be closed.
   * The `reason` parameter can optionally be used to control the response to `onClose`.
   */
  onClose: a.func,
  /**
   * If `true`, the component is shown.
   */
  open: a.bool.isRequired,
  /**
   * Props applied to the [`Paper`](https://mui.com/material-ui/api/paper/) element.
   *
   * This prop is an alias for `slotProps.paper` and will be overridden by it if both are used.
   * @deprecated Use `slotProps.paper` instead.
   *
   * @default {}
   */
  PaperProps: a.shape({
    component: gc
  }),
  /**
   * The props used for each slot inside.
   * @default {}
   */
  slotProps: a.shape({
    backdrop: a.oneOfType([a.func, a.object]),
    paper: a.oneOfType([a.func, a.object]),
    root: a.oneOfType([a.func, a.object]),
    transition: a.oneOfType([a.func, a.object])
  }),
  /**
   * The components used for each slot inside.
   * @default {}
   */
  slots: a.shape({
    backdrop: a.elementType,
    paper: a.elementType,
    root: a.elementType,
    transition: a.elementType
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: a.oneOfType([a.arrayOf(a.oneOfType([a.func, a.object, a.bool])), a.func, a.object]),
  /**
   * This is the point on the popover which
   * will attach to the anchor's origin.
   *
   * Options:
   * vertical: [top, center, bottom, x(px)];
   * horizontal: [left, center, right, x(px)].
   * @default {
   *   vertical: 'top',
   *   horizontal: 'left',
   * }
   */
  transformOrigin: a.shape({
    horizontal: a.oneOfType([a.oneOf(["center", "left", "right"]), a.number]).isRequired,
    vertical: a.oneOfType([a.oneOf(["bottom", "center", "top"]), a.number]).isRequired
  }),
  /**
   * The component used for the transition.
   * [Follow this guide](https://mui.com/material-ui/transitions/#transitioncomponent-prop) to learn more about the requirements for this component.
   * @deprecated use the `slots.transition` prop instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   * @default Grow
   */
  TransitionComponent: a.elementType,
  /**
   * Set to 'auto' to automatically calculate transition time based on height.
   * @default 'auto'
   */
  transitionDuration: a.oneOfType([a.oneOf(["auto"]), a.number, a.shape({
    appear: a.number,
    enter: a.number,
    exit: a.number
  })]),
  /**
   * Props applied to the transition element.
   * By default, the element is based on this [`Transition`](https://reactcommunity.org/react-transition-group/transition/) component.
   * @deprecated use the `slotProps.transition` prop instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   * @default {}
   */
  TransitionProps: a.object
});
function Bb(r) {
  return _n("MuiMenu", r);
}
wn("MuiMenu", ["root", "paper", "list"]);
const Fb = {
  vertical: "top",
  horizontal: "right"
}, $b = {
  vertical: "top",
  horizontal: "left"
}, zb = (r) => {
  const {
    classes: i
  } = r;
  return Dn({
    root: ["root"],
    paper: ["paper"],
    list: ["list"]
  }, Bb, i);
}, Wb = Pe(Pc, {
  shouldForwardProp: (r) => xs(r) || r === "classes",
  name: "MuiMenu",
  slot: "Root"
})({}), Ub = Pe(Oc, {
  name: "MuiMenu",
  slot: "Paper"
})({
  // specZ: The maximum height of a simple menu should be one or more rows less than the view
  // height. This ensures a tappable area outside of the simple menu with which to dismiss
  // the menu.
  maxHeight: "calc(100% - 96px)",
  // Add iOS momentum scrolling for iOS < 13.0
  WebkitOverflowScrolling: "touch"
}), Hb = Pe(pc, {
  name: "MuiMenu",
  slot: "List"
})({
  // We disable the focus ring for mouse, touch and keyboard users.
  outline: 0
}), Mc = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const l = En({
    props: i,
    name: "MuiMenu"
  }), {
    autoFocus: f = !0,
    children: c,
    className: h,
    disableAutoFocusItem: g = !1,
    MenuListProps: y = {},
    onClose: b,
    open: E,
    PaperProps: R = {},
    PopoverClasses: N,
    transitionDuration: M = "auto",
    TransitionProps: {
      onEntering: A,
      ...k
    } = {},
    variant: z = "selectedMenu",
    slots: B = {},
    slotProps: H = {},
    ...L
  } = l, D = yy(), U = {
    ...l,
    autoFocus: f,
    disableAutoFocusItem: g,
    MenuListProps: y,
    onEntering: A,
    PaperProps: R,
    transitionDuration: M,
    TransitionProps: k,
    variant: z
  }, q = zb(U), W = f && !g && E, G = C.useRef(null), Z = (X, we) => {
    G.current && G.current.adjustStyleForScrollbar(X, {
      direction: D ? "rtl" : "ltr"
    }), A && A(X, we);
  }, ge = (X) => {
    X.key === "Tab" && (X.preventDefault(), b && b(X, "tabKeyDown"));
  };
  let de = -1;
  C.Children.map(c, (X, we) => {
    /* @__PURE__ */ C.isValidElement(X) && (process.env.NODE_ENV !== "production" && So.isFragment(X) && console.error(["MUI: The Menu component doesn't accept a Fragment as a child.", "Consider providing an array instead."].join(`
`)), X.props.disabled || (z === "selectedMenu" && X.props.selected || de === -1) && (de = we));
  });
  const se = {
    slots: B,
    slotProps: {
      list: y,
      transition: k,
      paper: R,
      ...H
    }
  }, re = Hy({
    elementType: B.root,
    externalSlotProps: H.root,
    ownerState: U,
    className: [q.root, h]
  }), [te, $] = tt("paper", {
    className: q.paper,
    elementType: Ub,
    externalForwardedProps: se,
    shouldForwardComponentProp: !0,
    ownerState: U
  }), [K, le] = tt("list", {
    className: Te(q.list, y.className),
    elementType: Hb,
    shouldForwardComponentProp: !0,
    externalForwardedProps: se,
    getSlotProps: (X) => ({
      ...X,
      onKeyDown: (we) => {
        ge(we), X.onKeyDown?.(we);
      }
    }),
    ownerState: U
  }), Ce = typeof se.slotProps.transition == "function" ? se.slotProps.transition(U) : se.slotProps.transition;
  return /* @__PURE__ */ S(Wb, {
    onClose: b,
    anchorOrigin: {
      vertical: "bottom",
      horizontal: D ? "right" : "left"
    },
    transformOrigin: D ? Fb : $b,
    slots: {
      root: B.root,
      paper: te,
      backdrop: B.backdrop,
      ...B.transition && {
        // TODO: pass `slots.transition` directly once `TransitionComponent` is removed from Popover
        transition: B.transition
      }
    },
    slotProps: {
      root: re,
      paper: $,
      backdrop: typeof H.backdrop == "function" ? H.backdrop(U) : H.backdrop,
      transition: {
        ...Ce,
        onEntering: (...X) => {
          Z(...X), Ce?.onEntering?.(...X);
        }
      }
    },
    open: E,
    ref: o,
    transitionDuration: M,
    ownerState: U,
    ...L,
    classes: N,
    children: /* @__PURE__ */ S(K, {
      actions: G,
      autoFocus: f && (de === -1 || g),
      autoFocusItem: W,
      variant: z,
      ...le,
      children: c
    })
  });
});
process.env.NODE_ENV !== "production" && (Mc.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * An HTML element, or a function that returns one.
   * It's used to set the position of the menu.
   */
  anchorEl: a.oneOfType([Sr, a.func]),
  /**
   * If `true` (Default) will focus the `[role="menu"]` if no focusable child is found. Disabled
   * children are not focusable. If you set this prop to `false` focus will be placed
   * on the parent modal container. This has severe accessibility implications
   * and should only be considered if you manage focus otherwise.
   * @default true
   */
  autoFocus: a.bool,
  /**
   * Menu contents, normally `MenuItem`s.
   */
  children: a.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: a.object,
  /**
   * @ignore
   */
  className: a.string,
  /**
   * When opening the menu will not focus the active item but the `[role="menu"]`
   * unless `autoFocus` is also set to `false`. Not using the default means not
   * following WAI-ARIA authoring practices. Please be considerate about possible
   * accessibility implications.
   * @default false
   */
  disableAutoFocusItem: a.bool,
  /**
   * Props applied to the [`MenuList`](https://mui.com/material-ui/api/menu-list/) element.
   * @deprecated use the `slotProps.list` prop instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   * @default {}
   */
  MenuListProps: a.object,
  /**
   * Callback fired when the component requests to be closed.
   *
   * @param {object} event The event source of the callback.
   * @param {string} reason Can be: `"escapeKeyDown"`, `"backdropClick"`, `"tabKeyDown"`.
   */
  onClose: a.func,
  /**
   * If `true`, the component is shown.
   */
  open: a.bool.isRequired,
  /**
   * @ignore
   */
  PaperProps: a.object,
  /**
   * `classes` prop applied to the [`Popover`](https://mui.com/material-ui/api/popover/) element.
   */
  PopoverClasses: a.object,
  /**
   * The props used for each slot inside.
   * @default {}
   */
  slotProps: a.shape({
    backdrop: a.oneOfType([a.func, a.object]),
    list: a.oneOfType([a.func, a.object]),
    paper: a.oneOfType([a.func, a.object]),
    root: a.oneOfType([a.func, a.object]),
    transition: a.oneOfType([a.func, a.object])
  }),
  /**
   * The components used for each slot inside.
   * @default {}
   */
  slots: a.shape({
    backdrop: a.elementType,
    list: a.elementType,
    paper: a.elementType,
    root: a.elementType,
    transition: a.elementType
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: a.oneOfType([a.arrayOf(a.oneOfType([a.func, a.object, a.bool])), a.func, a.object]),
  /**
   * The length of the transition in `ms`, or 'auto'
   * @default 'auto'
   */
  transitionDuration: a.oneOfType([a.oneOf(["auto"]), a.number, a.shape({
    appear: a.number,
    enter: a.number,
    exit: a.number
  })]),
  /**
   * Props applied to the transition element.
   * By default, the element is based on this [`Transition`](https://reactcommunity.org/react-transition-group/transition/) component.
   * @deprecated use the `slotProps.transition` prop instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   * @default {}
   */
  TransitionProps: a.object,
  /**
   * The variant to use. Use `menu` to prevent selected items from impacting the initial focus.
   * @default 'selectedMenu'
   */
  variant: a.oneOf(["menu", "selectedMenu"])
});
const Vb = (r) => {
  switch (r) {
    case "bottom-end":
      return {
        anchorOrigin: { horizontal: "right", vertical: "bottom" },
        transformOrigin: { horizontal: "right", vertical: "top" }
      };
    case "bottom-start":
      return {
        anchorOrigin: { horizontal: "left", vertical: "bottom" },
        transformOrigin: { horizontal: "left", vertical: "top" }
      };
    case "top-end":
      return {
        anchorOrigin: { horizontal: "right", vertical: "top" },
        transformOrigin: { horizontal: "right", vertical: "bottom" }
      };
    case "top-start":
      return {
        anchorOrigin: { horizontal: "left", vertical: "top" },
        transformOrigin: { horizontal: "left", vertical: "bottom" }
      };
    case "top":
      return {
        anchorOrigin: { horizontal: "center", vertical: "top" },
        transformOrigin: { horizontal: "center", vertical: "bottom" }
      };
    default:
      return {
        anchorOrigin: { horizontal: "center", vertical: "bottom" },
        transformOrigin: { horizontal: "center", vertical: "top" }
      };
  }
}, Gb = ({
  children: r,
  placement: i = "bottom",
  onClose: o,
  closeOnItemClick: l = !1,
  sx: f,
  className: c
}) => {
  const { open: h, setOpen: g, anchorEl: y, menuId: b, buttonId: E } = ws(), R = (A, k) => {
    g(!1), o && o(A, k);
  }, N = () => {
    l && g(!1);
  }, M = Vb(i);
  return /* @__PURE__ */ S(
    Mc,
    {
      component: "div",
      id: b,
      anchorEl: y,
      open: h,
      onClose: R,
      onClick: N,
      slotProps: {
        list: {
          "aria-labelledby": E
        }
      },
      sx: f,
      className: c,
      ...M,
      children: r
    }
  );
};
function Iu(r) {
  try {
    return r.matches(":focus-visible");
  } catch {
    process.env.NODE_ENV !== "production" && !window.navigator.userAgent.includes("jsdom") && console.warn(["MUI: The `:focus-visible` pseudo class is not supported in this browser.", "Some components rely on this feature to work properly."].join(`
`));
  }
  return !1;
}
class Lo {
  /** React ref to the ripple instance */
  /** If the ripple component should be mounted */
  /** Promise that resolves when the ripple component is mounted */
  /** If the ripple component has been mounted */
  /** React state hook setter */
  static create() {
    return new Lo();
  }
  static use() {
    const i = bc(Lo.create).current, [o, l] = C.useState(!1);
    return i.shouldMount = o, i.setShouldMount = l, C.useEffect(i.mountEffect, [o]), i;
  }
  constructor() {
    this.ref = {
      current: null
    }, this.mounted = null, this.didMount = !1, this.shouldMount = !1, this.setShouldMount = null;
  }
  mount() {
    return this.mounted || (this.mounted = qb(), this.shouldMount = !0, this.setShouldMount(this.shouldMount)), this.mounted;
  }
  mountEffect = () => {
    this.shouldMount && !this.didMount && this.ref.current !== null && (this.didMount = !0, this.mounted.resolve());
  };
  /* Ripple API */
  start(...i) {
    this.mount().then(() => this.ref.current?.start(...i));
  }
  stop(...i) {
    this.mount().then(() => this.ref.current?.stop(...i));
  }
  pulsate(...i) {
    this.mount().then(() => this.ref.current?.pulsate(...i));
  }
}
function Kb() {
  return Lo.use();
}
function qb() {
  let r, i;
  const o = new Promise((l, f) => {
    r = l, i = f;
  });
  return o.resolve = r, o.reject = i, o;
}
function Ac(r) {
  const {
    className: i,
    classes: o,
    pulsate: l = !1,
    rippleX: f,
    rippleY: c,
    rippleSize: h,
    in: g,
    onExited: y,
    timeout: b
  } = r, [E, R] = C.useState(!1), N = Te(i, o.ripple, o.rippleVisible, l && o.ripplePulsate), M = {
    width: h,
    height: h,
    top: -(h / 2) + c,
    left: -(h / 2) + f
  }, A = Te(o.child, E && o.childLeaving, l && o.childPulsate);
  return !g && !E && R(!0), C.useEffect(() => {
    if (!g && y != null) {
      const k = setTimeout(y, b);
      return () => {
        clearTimeout(k);
      };
    }
  }, [y, g, b]), /* @__PURE__ */ S("span", {
    className: N,
    style: M,
    children: /* @__PURE__ */ S("span", {
      className: A
    })
  });
}
process.env.NODE_ENV !== "production" && (Ac.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  classes: a.object.isRequired,
  className: a.string,
  /**
   * @ignore - injected from TransitionGroup
   */
  in: a.bool,
  /**
   * @ignore - injected from TransitionGroup
   */
  onExited: a.func,
  /**
   * If `true`, the ripple pulsates, typically indicating the keyboard focus state of an element.
   */
  pulsate: a.bool,
  /**
   * Diameter of the ripple.
   */
  rippleSize: a.number,
  /**
   * Horizontal position of the ripple center.
   */
  rippleX: a.number,
  /**
   * Vertical position of the ripple center.
   */
  rippleY: a.number,
  /**
   * exit delay
   */
  timeout: a.number.isRequired
});
const xn = wn("MuiTouchRipple", ["root", "ripple", "rippleVisible", "ripplePulsate", "child", "childLeaving", "childPulsate"]), vs = 550, Yb = 80, Xb = Tr`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`, Zb = Tr`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`, jb = Tr`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`, Jb = Pe("span", {
  name: "MuiTouchRipple",
  slot: "Root"
})({
  overflow: "hidden",
  pointerEvents: "none",
  position: "absolute",
  zIndex: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  borderRadius: "inherit"
}), Qb = Pe(Ac, {
  name: "MuiTouchRipple",
  slot: "Ripple"
})`
  opacity: 0;
  position: absolute;

  &.${xn.rippleVisible} {
    opacity: 0.3;
    transform: scale(1);
    animation-name: ${Xb};
    animation-duration: ${vs}ms;
    animation-timing-function: ${({
  theme: r
}) => r.transitions.easing.easeInOut};
  }

  &.${xn.ripplePulsate} {
    animation-duration: ${({
  theme: r
}) => r.transitions.duration.shorter}ms;
  }

  & .${xn.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${xn.childLeaving} {
    opacity: 0;
    animation-name: ${Zb};
    animation-duration: ${vs}ms;
    animation-timing-function: ${({
  theme: r
}) => r.transitions.easing.easeInOut};
  }

  & .${xn.childPulsate} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
    animation-name: ${jb};
    animation-duration: 2500ms;
    animation-timing-function: ${({
  theme: r
}) => r.transitions.easing.easeInOut};
    animation-iteration-count: infinite;
    animation-delay: 200ms;
  }
`, Nc = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const l = En({
    props: i,
    name: "MuiTouchRipple"
  }), {
    center: f = !1,
    classes: c = {},
    className: h,
    ...g
  } = l, [y, b] = C.useState([]), E = C.useRef(0), R = C.useRef(null);
  C.useEffect(() => {
    R.current && (R.current(), R.current = null);
  }, [y]);
  const N = C.useRef(!1), M = xc(), A = C.useRef(null), k = C.useRef(null), z = C.useCallback((D) => {
    const {
      pulsate: U,
      rippleX: q,
      rippleY: W,
      rippleSize: G,
      cb: Z
    } = D;
    b((ge) => [...ge, /* @__PURE__ */ S(Qb, {
      classes: {
        ripple: Te(c.ripple, xn.ripple),
        rippleVisible: Te(c.rippleVisible, xn.rippleVisible),
        ripplePulsate: Te(c.ripplePulsate, xn.ripplePulsate),
        child: Te(c.child, xn.child),
        childLeaving: Te(c.childLeaving, xn.childLeaving),
        childPulsate: Te(c.childPulsate, xn.childPulsate)
      },
      timeout: vs,
      pulsate: U,
      rippleX: q,
      rippleY: W,
      rippleSize: G
    }, E.current)]), E.current += 1, R.current = Z;
  }, [c]), B = C.useCallback((D = {}, U = {}, q = () => {
  }) => {
    const {
      pulsate: W = !1,
      center: G = f || U.pulsate,
      fakeElement: Z = !1
      // For test purposes
    } = U;
    if (D?.type === "mousedown" && N.current) {
      N.current = !1;
      return;
    }
    D?.type === "touchstart" && (N.current = !0);
    const ge = Z ? null : k.current, de = ge ? ge.getBoundingClientRect() : {
      width: 0,
      height: 0,
      left: 0,
      top: 0
    };
    let se, re, te;
    if (G || D === void 0 || D.clientX === 0 && D.clientY === 0 || !D.clientX && !D.touches)
      se = Math.round(de.width / 2), re = Math.round(de.height / 2);
    else {
      const {
        clientX: $,
        clientY: K
      } = D.touches && D.touches.length > 0 ? D.touches[0] : D;
      se = Math.round($ - de.left), re = Math.round(K - de.top);
    }
    if (G)
      te = Math.sqrt((2 * de.width ** 2 + de.height ** 2) / 3), te % 2 === 0 && (te += 1);
    else {
      const $ = Math.max(Math.abs((ge ? ge.clientWidth : 0) - se), se) * 2 + 2, K = Math.max(Math.abs((ge ? ge.clientHeight : 0) - re), re) * 2 + 2;
      te = Math.sqrt($ ** 2 + K ** 2);
    }
    D?.touches ? A.current === null && (A.current = () => {
      z({
        pulsate: W,
        rippleX: se,
        rippleY: re,
        rippleSize: te,
        cb: q
      });
    }, M.start(Yb, () => {
      A.current && (A.current(), A.current = null);
    })) : z({
      pulsate: W,
      rippleX: se,
      rippleY: re,
      rippleSize: te,
      cb: q
    });
  }, [f, z, M]), H = C.useCallback(() => {
    B({}, {
      pulsate: !0
    });
  }, [B]), L = C.useCallback((D, U) => {
    if (M.clear(), D?.type === "touchend" && A.current) {
      A.current(), A.current = null, M.start(0, () => {
        L(D, U);
      });
      return;
    }
    A.current = null, b((q) => q.length > 0 ? q.slice(1) : q), R.current = U;
  }, [M]);
  return C.useImperativeHandle(o, () => ({
    pulsate: H,
    start: B,
    stop: L
  }), [H, B, L]), /* @__PURE__ */ S(Jb, {
    className: Te(xn.root, c.root, h),
    ref: k,
    ...g,
    children: /* @__PURE__ */ S(Ts, {
      component: null,
      exit: !0,
      children: y
    })
  });
});
process.env.NODE_ENV !== "production" && (Nc.propTypes = {
  /**
   * If `true`, the ripple starts at the center of the component
   * rather than at the point of interaction.
   */
  center: a.bool,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: a.object,
  /**
   * @ignore
   */
  className: a.string
});
function e1(r) {
  return _n("MuiButtonBase", r);
}
const n1 = wn("MuiButtonBase", ["root", "disabled", "focusVisible"]), t1 = (r) => {
  const {
    disabled: i,
    focusVisible: o,
    focusVisibleClassName: l,
    classes: f
  } = r, h = Dn({
    root: ["root", i && "disabled", o && "focusVisible"]
  }, e1, f);
  return o && l && (h.root += ` ${l}`), h;
}, r1 = Pe("button", {
  name: "MuiButtonBase",
  slot: "Root"
})({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  boxSizing: "border-box",
  WebkitTapHighlightColor: "transparent",
  backgroundColor: "transparent",
  // Reset default value
  // We disable the focus ring for mouse, touch and keyboard users.
  outline: 0,
  border: 0,
  margin: 0,
  // Remove the margin in Safari
  borderRadius: 0,
  padding: 0,
  // Remove the padding in Firefox
  cursor: "pointer",
  userSelect: "none",
  verticalAlign: "middle",
  MozAppearance: "none",
  // Reset
  WebkitAppearance: "none",
  // Reset
  textDecoration: "none",
  // So we take precedent over the style of a native <a /> element.
  color: "inherit",
  "&::-moz-focus-inner": {
    borderStyle: "none"
    // Remove Firefox dotted outline.
  },
  [`&.${n1.disabled}`]: {
    pointerEvents: "none",
    // Disable link interactions
    cursor: "default"
  },
  "@media print": {
    colorAdjust: "exact"
  }
}), Cs = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const l = En({
    props: i,
    name: "MuiButtonBase"
  }), {
    action: f,
    centerRipple: c = !1,
    children: h,
    className: g,
    component: y = "button",
    disabled: b = !1,
    disableRipple: E = !1,
    disableTouchRipple: R = !1,
    focusRipple: N = !1,
    focusVisibleClassName: M,
    LinkComponent: A = "a",
    onBlur: k,
    onClick: z,
    onContextMenu: B,
    onDragLeave: H,
    onFocus: L,
    onFocusVisible: D,
    onKeyDown: U,
    onKeyUp: q,
    onMouseDown: W,
    onMouseLeave: G,
    onMouseUp: Z,
    onTouchEnd: ge,
    onTouchMove: de,
    onTouchStart: se,
    tabIndex: re = 0,
    TouchRippleProps: te,
    touchRippleRef: $,
    type: K,
    ...le
  } = l, Ce = C.useRef(null), X = Kb(), we = Wn(X.ref, $), [Me, je] = C.useState(!1);
  b && Me && je(!1), C.useImperativeHandle(f, () => ({
    focusVisible: () => {
      je(!0), Ce.current.focus();
    }
  }), []);
  const Hn = X.shouldMount && !E && !b;
  C.useEffect(() => {
    Me && N && !E && X.pulsate();
  }, [E, N, Me, X]);
  const Sn = et(X, "start", W, R), rn = et(X, "stop", B, R), kn = et(X, "stop", H, R), ht = et(X, "stop", Z, R), Tn = et(X, "stop", (ne) => {
    Me && ne.preventDefault(), G && G(ne);
  }, R), Cn = et(X, "start", se, R), ve = et(X, "stop", ge, R), ye = et(X, "stop", de, R), Le = et(X, "stop", (ne) => {
    Iu(ne.target) || je(!1), k && k(ne);
  }, !1), fn = Zt((ne) => {
    Ce.current || (Ce.current = ne.currentTarget), Iu(ne.target) && (je(!0), D && D(ne)), L && L(ne);
  }), De = () => {
    const ne = Ce.current;
    return y && y !== "button" && !(ne.tagName === "A" && ne.href);
  }, Je = Zt((ne) => {
    N && !ne.repeat && Me && ne.key === " " && X.stop(ne, () => {
      X.start(ne);
    }), ne.target === ne.currentTarget && De() && ne.key === " " && ne.preventDefault(), U && U(ne), ne.target === ne.currentTarget && De() && ne.key === "Enter" && !b && (ne.preventDefault(), z && z(ne));
  }), At = Zt((ne) => {
    N && ne.key === " " && Me && !ne.defaultPrevented && X.stop(ne, () => {
      X.pulsate(ne);
    }), q && q(ne), z && ne.target === ne.currentTarget && De() && ne.key === " " && !ne.defaultPrevented && z(ne);
  });
  let He = y;
  He === "button" && (le.href || le.to) && (He = A);
  const Rn = {};
  if (He === "button") {
    const ne = !!le.formAction;
    Rn.type = K === void 0 && !ne ? "button" : K, Rn.disabled = b;
  } else
    !le.href && !le.to && (Rn.role = "button"), b && (Rn["aria-disabled"] = b);
  const Vn = Wn(o, Ce), In = {
    ...l,
    centerRipple: c,
    component: y,
    disabled: b,
    disableRipple: E,
    disableTouchRipple: R,
    focusRipple: N,
    tabIndex: re,
    focusVisible: Me
  }, Ie = t1(In);
  return /* @__PURE__ */ fe(r1, {
    as: He,
    className: Te(Ie.root, g),
    ownerState: In,
    onBlur: Le,
    onClick: z,
    onContextMenu: rn,
    onFocus: fn,
    onKeyDown: Je,
    onKeyUp: At,
    onMouseDown: Sn,
    onMouseLeave: Tn,
    onMouseUp: ht,
    onDragLeave: kn,
    onTouchEnd: ve,
    onTouchMove: ye,
    onTouchStart: Cn,
    ref: Vn,
    tabIndex: b ? -1 : re,
    type: K,
    ...Rn,
    ...le,
    children: [h, Hn ? /* @__PURE__ */ S(Nc, {
      ref: we,
      center: c,
      ...te
    }) : null]
  });
});
function et(r, i, o, l = !1) {
  return Zt((f) => (o && o(f), l || r[i](f), !0));
}
process.env.NODE_ENV !== "production" && (Cs.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A ref for imperative actions.
   * It currently only supports `focusVisible()` action.
   */
  action: hc,
  /**
   * If `true`, the ripples are centered.
   * They won't start at the cursor interaction position.
   * @default false
   */
  centerRipple: a.bool,
  /**
   * The content of the component.
   */
  children: a.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: a.object,
  /**
   * @ignore
   */
  className: a.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: gc,
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: a.bool,
  /**
   * If `true`, the ripple effect is disabled.
   *
   * ⚠️ Without a ripple there is no styling for :focus-visible by default. Be sure
   * to highlight the element by applying separate styles with the `.Mui-focusVisible` class.
   * @default false
   */
  disableRipple: a.bool,
  /**
   * If `true`, the touch ripple effect is disabled.
   * @default false
   */
  disableTouchRipple: a.bool,
  /**
   * If `true`, the base button will have a keyboard focus ripple.
   * @default false
   */
  focusRipple: a.bool,
  /**
   * This prop can help identify which element has keyboard focus.
   * The class name will be applied when the element gains the focus through keyboard interaction.
   * It's a polyfill for the [CSS :focus-visible selector](https://drafts.csswg.org/selectors-4/#the-focus-visible-pseudo).
   * The rationale for using this feature [is explained here](https://github.com/WICG/focus-visible/blob/HEAD/explainer.md).
   * A [polyfill can be used](https://github.com/WICG/focus-visible) to apply a `focus-visible` class to other components
   * if needed.
   */
  focusVisibleClassName: a.string,
  /**
   * @ignore
   */
  formAction: a.oneOfType([a.func, a.string]),
  /**
   * @ignore
   */
  href: a.any,
  /**
   * The component used to render a link when the `href` prop is provided.
   * @default 'a'
   */
  LinkComponent: a.elementType,
  /**
   * @ignore
   */
  onBlur: a.func,
  /**
   * @ignore
   */
  onClick: a.func,
  /**
   * @ignore
   */
  onContextMenu: a.func,
  /**
   * @ignore
   */
  onDragLeave: a.func,
  /**
   * @ignore
   */
  onFocus: a.func,
  /**
   * Callback fired when the component is focused with a keyboard.
   * We trigger a `onFocus` callback too.
   */
  onFocusVisible: a.func,
  /**
   * @ignore
   */
  onKeyDown: a.func,
  /**
   * @ignore
   */
  onKeyUp: a.func,
  /**
   * @ignore
   */
  onMouseDown: a.func,
  /**
   * @ignore
   */
  onMouseLeave: a.func,
  /**
   * @ignore
   */
  onMouseUp: a.func,
  /**
   * @ignore
   */
  onTouchEnd: a.func,
  /**
   * @ignore
   */
  onTouchMove: a.func,
  /**
   * @ignore
   */
  onTouchStart: a.func,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: a.oneOfType([a.arrayOf(a.oneOfType([a.func, a.object, a.bool])), a.func, a.object]),
  /**
   * @default 0
   */
  tabIndex: a.number,
  /**
   * Props applied to the `TouchRipple` element.
   */
  TouchRippleProps: a.object,
  /**
   * A ref that points to the `TouchRipple` element.
   */
  touchRippleRef: a.oneOfType([a.func, a.shape({
    current: a.shape({
      pulsate: a.func.isRequired,
      start: a.func.isRequired,
      stop: a.func.isRequired
    })
  })]),
  /**
   * @ignore
   */
  type: a.oneOfType([a.oneOf(["button", "reset", "submit"]), a.string])
});
function o1(r) {
  return typeof r.main == "string";
}
function i1(r, i = []) {
  if (!o1(r))
    return !1;
  for (const o of i)
    if (!r.hasOwnProperty(o) || typeof r[o] != "string")
      return !1;
  return !0;
}
function Do(r = []) {
  return ([, i]) => i && i1(i, r);
}
function s1(r) {
  return _n("MuiCircularProgress", r);
}
wn("MuiCircularProgress", ["root", "determinate", "indeterminate", "colorPrimary", "colorSecondary", "svg", "track", "circle", "circleDeterminate", "circleIndeterminate", "circleDisableShrink"]);
const Nn = 44, ys = Tr`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`, bs = Tr`
  0% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -15px;
  }

  100% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: -126px;
  }
`, a1 = typeof ys != "string" ? Uu`
        animation: ${ys} 1.4s linear infinite;
      ` : null, l1 = typeof bs != "string" ? Uu`
        animation: ${bs} 1.4s ease-in-out infinite;
      ` : null, u1 = (r) => {
  const {
    classes: i,
    variant: o,
    color: l,
    disableShrink: f
  } = r, c = {
    root: ["root", o, `color${Se(l)}`],
    svg: ["svg"],
    track: ["track"],
    circle: ["circle", `circle${Se(o)}`, f && "circleDisableShrink"]
  };
  return Dn(c, s1, i);
}, c1 = Pe("span", {
  name: "MuiCircularProgress",
  slot: "Root",
  overridesResolver: (r, i) => {
    const {
      ownerState: o
    } = r;
    return [i.root, i[o.variant], i[`color${Se(o.color)}`]];
  }
})(rt(({
  theme: r
}) => ({
  display: "inline-block",
  variants: [{
    props: {
      variant: "determinate"
    },
    style: {
      transition: r.transitions.create("transform")
    }
  }, {
    props: {
      variant: "indeterminate"
    },
    style: a1 || {
      animation: `${ys} 1.4s linear infinite`
    }
  }, ...Object.entries(r.palette).filter(Do()).map(([i]) => ({
    props: {
      color: i
    },
    style: {
      color: (r.vars || r).palette[i].main
    }
  }))]
}))), f1 = Pe("svg", {
  name: "MuiCircularProgress",
  slot: "Svg"
})({
  display: "block"
  // Keeps the progress centered
}), d1 = Pe("circle", {
  name: "MuiCircularProgress",
  slot: "Circle",
  overridesResolver: (r, i) => {
    const {
      ownerState: o
    } = r;
    return [i.circle, i[`circle${Se(o.variant)}`], o.disableShrink && i.circleDisableShrink];
  }
})(rt(({
  theme: r
}) => ({
  stroke: "currentColor",
  variants: [{
    props: {
      variant: "determinate"
    },
    style: {
      transition: r.transitions.create("stroke-dashoffset")
    }
  }, {
    props: {
      variant: "indeterminate"
    },
    style: {
      // Some default value that looks fine waiting for the animation to kicks in.
      strokeDasharray: "80px, 200px",
      strokeDashoffset: 0
      // Add the unit to fix a Edge 16 and below bug.
    }
  }, {
    props: ({
      ownerState: i
    }) => i.variant === "indeterminate" && !i.disableShrink,
    style: l1 || {
      // At runtime for Pigment CSS, `bufferAnimation` will be null and the generated keyframe will be used.
      animation: `${bs} 1.4s ease-in-out infinite`
    }
  }]
}))), p1 = Pe("circle", {
  name: "MuiCircularProgress",
  slot: "Track"
})(rt(({
  theme: r
}) => ({
  stroke: "currentColor",
  opacity: (r.vars || r).palette.action.activatedOpacity
}))), Rs = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const l = En({
    props: i,
    name: "MuiCircularProgress"
  }), {
    className: f,
    color: c = "primary",
    disableShrink: h = !1,
    enableTrackSlot: g = !1,
    size: y = 40,
    style: b,
    thickness: E = 3.6,
    value: R = 0,
    variant: N = "indeterminate",
    ...M
  } = l, A = {
    ...l,
    color: c,
    disableShrink: h,
    size: y,
    thickness: E,
    value: R,
    variant: N,
    enableTrackSlot: g
  }, k = u1(A), z = {}, B = {}, H = {};
  if (N === "determinate") {
    const L = 2 * Math.PI * ((Nn - E) / 2);
    z.strokeDasharray = L.toFixed(3), H["aria-valuenow"] = Math.round(R), z.strokeDashoffset = `${((100 - R) / 100 * L).toFixed(3)}px`, B.transform = "rotate(-90deg)";
  }
  return /* @__PURE__ */ S(c1, {
    className: Te(k.root, f),
    style: {
      width: y,
      height: y,
      ...B,
      ...b
    },
    ownerState: A,
    ref: o,
    role: "progressbar",
    ...H,
    ...M,
    children: /* @__PURE__ */ fe(f1, {
      className: k.svg,
      ownerState: A,
      viewBox: `${Nn / 2} ${Nn / 2} ${Nn} ${Nn}`,
      children: [g ? /* @__PURE__ */ S(p1, {
        className: k.track,
        ownerState: A,
        cx: Nn,
        cy: Nn,
        r: (Nn - E) / 2,
        fill: "none",
        strokeWidth: E,
        "aria-hidden": "true"
      }) : null, /* @__PURE__ */ S(d1, {
        className: k.circle,
        style: z,
        ownerState: A,
        cx: Nn,
        cy: Nn,
        r: (Nn - E) / 2,
        fill: "none",
        strokeWidth: E
      })]
    })
  });
});
process.env.NODE_ENV !== "production" && (Rs.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Override or extend the styles applied to the component.
   */
  classes: a.object,
  /**
   * @ignore
   */
  className: a.string,
  /**
   * The color of the component.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   * @default 'primary'
   */
  color: a.oneOfType([a.oneOf(["inherit", "primary", "secondary", "error", "info", "success", "warning"]), a.string]),
  /**
   * If `true`, the shrink animation is disabled.
   * This only works if variant is `indeterminate`.
   * @default false
   */
  disableShrink: Mt(a.bool, (r) => r.disableShrink && r.variant && r.variant !== "indeterminate" ? new Error("MUI: You have provided the `disableShrink` prop with a variant other than `indeterminate`. This will have no effect.") : null),
  /**
   * If `true`, a track circle slot is mounted to show a subtle background for the progress.
   * The `size` and `thickness` apply to the track slot to be consistent with the progress circle.
   * @default false
   */
  enableTrackSlot: a.bool,
  /**
   * The size of the component.
   * If using a number, the pixel unit is assumed.
   * If using a string, you need to provide the CSS unit, for example '3rem'.
   * @default 40
   */
  size: a.oneOfType([a.number, a.string]),
  /**
   * @ignore
   */
  style: a.object,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: a.oneOfType([a.arrayOf(a.oneOfType([a.func, a.object, a.bool])), a.func, a.object]),
  /**
   * The thickness of the circle.
   * @default 3.6
   */
  thickness: a.number,
  /**
   * The value of the progress indicator for the determinate variant.
   * Value between 0 and 100.
   * @default 0
   */
  value: a.number,
  /**
   * The variant to use.
   * Use indeterminate when there is no progress value.
   * @default 'indeterminate'
   */
  variant: a.oneOf(["determinate", "indeterminate"])
});
function h1(r) {
  return _n("MuiButton", r);
}
const St = wn("MuiButton", ["root", "text", "textInherit", "textPrimary", "textSecondary", "textSuccess", "textError", "textInfo", "textWarning", "outlined", "outlinedInherit", "outlinedPrimary", "outlinedSecondary", "outlinedSuccess", "outlinedError", "outlinedInfo", "outlinedWarning", "contained", "containedInherit", "containedPrimary", "containedSecondary", "containedSuccess", "containedError", "containedInfo", "containedWarning", "disableElevation", "focusVisible", "disabled", "colorInherit", "colorPrimary", "colorSecondary", "colorSuccess", "colorError", "colorInfo", "colorWarning", "textSizeSmall", "textSizeMedium", "textSizeLarge", "outlinedSizeSmall", "outlinedSizeMedium", "outlinedSizeLarge", "containedSizeSmall", "containedSizeMedium", "containedSizeLarge", "sizeMedium", "sizeSmall", "sizeLarge", "fullWidth", "startIcon", "endIcon", "icon", "iconSizeSmall", "iconSizeMedium", "iconSizeLarge", "loading", "loadingWrapper", "loadingIconPlaceholder", "loadingIndicator", "loadingPositionCenter", "loadingPositionStart", "loadingPositionEnd"]), Lc = /* @__PURE__ */ C.createContext({});
process.env.NODE_ENV !== "production" && (Lc.displayName = "ButtonGroupContext");
const Dc = /* @__PURE__ */ C.createContext(void 0);
process.env.NODE_ENV !== "production" && (Dc.displayName = "ButtonGroupButtonContext");
const g1 = (r) => {
  const {
    color: i,
    disableElevation: o,
    fullWidth: l,
    size: f,
    variant: c,
    loading: h,
    loadingPosition: g,
    classes: y
  } = r, b = {
    root: ["root", h && "loading", c, `${c}${Se(i)}`, `size${Se(f)}`, `${c}Size${Se(f)}`, `color${Se(i)}`, o && "disableElevation", l && "fullWidth", h && `loadingPosition${Se(g)}`],
    startIcon: ["icon", "startIcon", `iconSize${Se(f)}`],
    endIcon: ["icon", "endIcon", `iconSize${Se(f)}`],
    loadingIndicator: ["loadingIndicator"],
    loadingWrapper: ["loadingWrapper"]
  }, E = Dn(b, h1, y);
  return {
    ...y,
    // forward the focused, disabled, etc. classes to the ButtonBase
    ...E
  };
}, kc = [{
  props: {
    size: "small"
  },
  style: {
    "& > *:nth-of-type(1)": {
      fontSize: 18
    }
  }
}, {
  props: {
    size: "medium"
  },
  style: {
    "& > *:nth-of-type(1)": {
      fontSize: 20
    }
  }
}, {
  props: {
    size: "large"
  },
  style: {
    "& > *:nth-of-type(1)": {
      fontSize: 22
    }
  }
}], m1 = Pe(Cs, {
  shouldForwardProp: (r) => xs(r) || r === "classes",
  name: "MuiButton",
  slot: "Root",
  overridesResolver: (r, i) => {
    const {
      ownerState: o
    } = r;
    return [i.root, i[o.variant], i[`${o.variant}${Se(o.color)}`], i[`size${Se(o.size)}`], i[`${o.variant}Size${Se(o.size)}`], o.color === "inherit" && i.colorInherit, o.disableElevation && i.disableElevation, o.fullWidth && i.fullWidth, o.loading && i.loading];
  }
})(rt(({
  theme: r
}) => {
  const i = r.palette.mode === "light" ? r.palette.grey[300] : r.palette.grey[800], o = r.palette.mode === "light" ? r.palette.grey.A100 : r.palette.grey[700];
  return {
    ...r.typography.button,
    minWidth: 64,
    padding: "6px 16px",
    border: 0,
    borderRadius: (r.vars || r).shape.borderRadius,
    transition: r.transitions.create(["background-color", "box-shadow", "border-color", "color"], {
      duration: r.transitions.duration.short
    }),
    "&:hover": {
      textDecoration: "none"
    },
    [`&.${St.disabled}`]: {
      color: (r.vars || r).palette.action.disabled
    },
    variants: [{
      props: {
        variant: "contained"
      },
      style: {
        color: "var(--variant-containedColor)",
        backgroundColor: "var(--variant-containedBg)",
        boxShadow: (r.vars || r).shadows[2],
        "&:hover": {
          boxShadow: (r.vars || r).shadows[4],
          // Reset on touch devices, it doesn't add specificity
          "@media (hover: none)": {
            boxShadow: (r.vars || r).shadows[2]
          }
        },
        "&:active": {
          boxShadow: (r.vars || r).shadows[8]
        },
        [`&.${St.focusVisible}`]: {
          boxShadow: (r.vars || r).shadows[6]
        },
        [`&.${St.disabled}`]: {
          color: (r.vars || r).palette.action.disabled,
          boxShadow: (r.vars || r).shadows[0],
          backgroundColor: (r.vars || r).palette.action.disabledBackground
        }
      }
    }, {
      props: {
        variant: "outlined"
      },
      style: {
        padding: "5px 15px",
        border: "1px solid currentColor",
        borderColor: "var(--variant-outlinedBorder, currentColor)",
        backgroundColor: "var(--variant-outlinedBg)",
        color: "var(--variant-outlinedColor)",
        [`&.${St.disabled}`]: {
          border: `1px solid ${(r.vars || r).palette.action.disabledBackground}`
        }
      }
    }, {
      props: {
        variant: "text"
      },
      style: {
        padding: "6px 8px",
        color: "var(--variant-textColor)",
        backgroundColor: "var(--variant-textBg)"
      }
    }, ...Object.entries(r.palette).filter(Do()).map(([l]) => ({
      props: {
        color: l
      },
      style: {
        "--variant-textColor": (r.vars || r).palette[l].main,
        "--variant-outlinedColor": (r.vars || r).palette[l].main,
        "--variant-outlinedBorder": r.alpha((r.vars || r).palette[l].main, 0.5),
        "--variant-containedColor": (r.vars || r).palette[l].contrastText,
        "--variant-containedBg": (r.vars || r).palette[l].main,
        "@media (hover: hover)": {
          "&:hover": {
            "--variant-containedBg": (r.vars || r).palette[l].dark,
            "--variant-textBg": r.alpha((r.vars || r).palette[l].main, (r.vars || r).palette.action.hoverOpacity),
            "--variant-outlinedBorder": (r.vars || r).palette[l].main,
            "--variant-outlinedBg": r.alpha((r.vars || r).palette[l].main, (r.vars || r).palette.action.hoverOpacity)
          }
        }
      }
    })), {
      props: {
        color: "inherit"
      },
      style: {
        color: "inherit",
        borderColor: "currentColor",
        "--variant-containedBg": r.vars ? r.vars.palette.Button.inheritContainedBg : i,
        "@media (hover: hover)": {
          "&:hover": {
            "--variant-containedBg": r.vars ? r.vars.palette.Button.inheritContainedHoverBg : o,
            "--variant-textBg": r.alpha((r.vars || r).palette.text.primary, (r.vars || r).palette.action.hoverOpacity),
            "--variant-outlinedBg": r.alpha((r.vars || r).palette.text.primary, (r.vars || r).palette.action.hoverOpacity)
          }
        }
      }
    }, {
      props: {
        size: "small",
        variant: "text"
      },
      style: {
        padding: "4px 5px",
        fontSize: r.typography.pxToRem(13)
      }
    }, {
      props: {
        size: "large",
        variant: "text"
      },
      style: {
        padding: "8px 11px",
        fontSize: r.typography.pxToRem(15)
      }
    }, {
      props: {
        size: "small",
        variant: "outlined"
      },
      style: {
        padding: "3px 9px",
        fontSize: r.typography.pxToRem(13)
      }
    }, {
      props: {
        size: "large",
        variant: "outlined"
      },
      style: {
        padding: "7px 21px",
        fontSize: r.typography.pxToRem(15)
      }
    }, {
      props: {
        size: "small",
        variant: "contained"
      },
      style: {
        padding: "4px 10px",
        fontSize: r.typography.pxToRem(13)
      }
    }, {
      props: {
        size: "large",
        variant: "contained"
      },
      style: {
        padding: "8px 22px",
        fontSize: r.typography.pxToRem(15)
      }
    }, {
      props: {
        disableElevation: !0
      },
      style: {
        boxShadow: "none",
        "&:hover": {
          boxShadow: "none"
        },
        [`&.${St.focusVisible}`]: {
          boxShadow: "none"
        },
        "&:active": {
          boxShadow: "none"
        },
        [`&.${St.disabled}`]: {
          boxShadow: "none"
        }
      }
    }, {
      props: {
        fullWidth: !0
      },
      style: {
        width: "100%"
      }
    }, {
      props: {
        loadingPosition: "center"
      },
      style: {
        transition: r.transitions.create(["background-color", "box-shadow", "border-color"], {
          duration: r.transitions.duration.short
        }),
        [`&.${St.loading}`]: {
          color: "transparent"
        }
      }
    }]
  };
})), v1 = Pe("span", {
  name: "MuiButton",
  slot: "StartIcon",
  overridesResolver: (r, i) => {
    const {
      ownerState: o
    } = r;
    return [i.startIcon, o.loading && i.startIconLoadingStart, i[`iconSize${Se(o.size)}`]];
  }
})(({
  theme: r
}) => ({
  display: "inherit",
  marginRight: 8,
  marginLeft: -4,
  variants: [{
    props: {
      size: "small"
    },
    style: {
      marginLeft: -2
    }
  }, {
    props: {
      loadingPosition: "start",
      loading: !0
    },
    style: {
      transition: r.transitions.create(["opacity"], {
        duration: r.transitions.duration.short
      }),
      opacity: 0
    }
  }, {
    props: {
      loadingPosition: "start",
      loading: !0,
      fullWidth: !0
    },
    style: {
      marginRight: -8
    }
  }, ...kc]
})), y1 = Pe("span", {
  name: "MuiButton",
  slot: "EndIcon",
  overridesResolver: (r, i) => {
    const {
      ownerState: o
    } = r;
    return [i.endIcon, o.loading && i.endIconLoadingEnd, i[`iconSize${Se(o.size)}`]];
  }
})(({
  theme: r
}) => ({
  display: "inherit",
  marginRight: -4,
  marginLeft: 8,
  variants: [{
    props: {
      size: "small"
    },
    style: {
      marginRight: -2
    }
  }, {
    props: {
      loadingPosition: "end",
      loading: !0
    },
    style: {
      transition: r.transitions.create(["opacity"], {
        duration: r.transitions.duration.short
      }),
      opacity: 0
    }
  }, {
    props: {
      loadingPosition: "end",
      loading: !0,
      fullWidth: !0
    },
    style: {
      marginLeft: -8
    }
  }, ...kc]
})), b1 = Pe("span", {
  name: "MuiButton",
  slot: "LoadingIndicator"
})(({
  theme: r
}) => ({
  display: "none",
  position: "absolute",
  visibility: "visible",
  variants: [{
    props: {
      loading: !0
    },
    style: {
      display: "flex"
    }
  }, {
    props: {
      loadingPosition: "start"
    },
    style: {
      left: 14
    }
  }, {
    props: {
      loadingPosition: "start",
      size: "small"
    },
    style: {
      left: 10
    }
  }, {
    props: {
      variant: "text",
      loadingPosition: "start"
    },
    style: {
      left: 6
    }
  }, {
    props: {
      loadingPosition: "center"
    },
    style: {
      left: "50%",
      transform: "translate(-50%)",
      color: (r.vars || r).palette.action.disabled
    }
  }, {
    props: {
      loadingPosition: "end"
    },
    style: {
      right: 14
    }
  }, {
    props: {
      loadingPosition: "end",
      size: "small"
    },
    style: {
      right: 10
    }
  }, {
    props: {
      variant: "text",
      loadingPosition: "end"
    },
    style: {
      right: 6
    }
  }, {
    props: {
      loadingPosition: "start",
      fullWidth: !0
    },
    style: {
      position: "relative",
      left: -10
    }
  }, {
    props: {
      loadingPosition: "end",
      fullWidth: !0
    },
    style: {
      position: "relative",
      right: -10
    }
  }]
})), Ou = Pe("span", {
  name: "MuiButton",
  slot: "LoadingIconPlaceholder"
})({
  display: "inline-block",
  width: "1em",
  height: "1em"
}), Bc = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const l = C.useContext(Lc), f = C.useContext(Dc), c = Co(l, i), h = En({
    props: c,
    name: "MuiButton"
  }), {
    children: g,
    color: y = "primary",
    component: b = "button",
    className: E,
    disabled: R = !1,
    disableElevation: N = !1,
    disableFocusRipple: M = !1,
    endIcon: A,
    focusVisibleClassName: k,
    fullWidth: z = !1,
    id: B,
    loading: H = null,
    loadingIndicator: L,
    loadingPosition: D = "center",
    size: U = "medium",
    startIcon: q,
    type: W,
    variant: G = "text",
    ...Z
  } = h, ge = ju(B), de = L ?? /* @__PURE__ */ S(Rs, {
    "aria-labelledby": ge,
    color: "inherit",
    size: 16
  }), se = {
    ...h,
    color: y,
    component: b,
    disabled: R,
    disableElevation: N,
    disableFocusRipple: M,
    fullWidth: z,
    loading: H,
    loadingIndicator: de,
    loadingPosition: D,
    size: U,
    type: W,
    variant: G
  }, re = g1(se), te = (q || H && D === "start") && /* @__PURE__ */ S(v1, {
    className: re.startIcon,
    ownerState: se,
    children: q || /* @__PURE__ */ S(Ou, {
      className: re.loadingIconPlaceholder,
      ownerState: se
    })
  }), $ = (A || H && D === "end") && /* @__PURE__ */ S(y1, {
    className: re.endIcon,
    ownerState: se,
    children: A || /* @__PURE__ */ S(Ou, {
      className: re.loadingIconPlaceholder,
      ownerState: se
    })
  }), K = f || "", le = typeof H == "boolean" ? (
    // use plain HTML span to minimize the runtime overhead
    /* @__PURE__ */ S("span", {
      className: re.loadingWrapper,
      style: {
        display: "contents"
      },
      children: H && /* @__PURE__ */ S(b1, {
        className: re.loadingIndicator,
        ownerState: se,
        children: de
      })
    })
  ) : null;
  return /* @__PURE__ */ fe(m1, {
    ownerState: se,
    className: Te(l.className, re.root, E, K),
    component: b,
    disabled: R || H,
    focusRipple: !M,
    focusVisibleClassName: Te(re.focusVisible, k),
    ref: o,
    type: W,
    id: H ? ge : B,
    ...Z,
    classes: re,
    children: [te, D !== "end" && le, g, D === "end" && le, $]
  });
});
process.env.NODE_ENV !== "production" && (Bc.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: a.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: a.object,
  /**
   * @ignore
   */
  className: a.string,
  /**
   * The color of the component.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   * @default 'primary'
   */
  color: a.oneOfType([a.oneOf(["inherit", "primary", "secondary", "success", "error", "info", "warning"]), a.string]),
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: a.elementType,
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: a.bool,
  /**
   * If `true`, no elevation is used.
   * @default false
   */
  disableElevation: a.bool,
  /**
   * If `true`, the  keyboard focus ripple is disabled.
   * @default false
   */
  disableFocusRipple: a.bool,
  /**
   * If `true`, the ripple effect is disabled.
   *
   * ⚠️ Without a ripple there is no styling for :focus-visible by default. Be sure
   * to highlight the element by applying separate styles with the `.Mui-focusVisible` class.
   * @default false
   */
  disableRipple: a.bool,
  /**
   * Element placed after the children.
   */
  endIcon: a.node,
  /**
   * @ignore
   */
  focusVisibleClassName: a.string,
  /**
   * If `true`, the button will take up the full width of its container.
   * @default false
   */
  fullWidth: a.bool,
  /**
   * The URL to link to when the button is clicked.
   * If defined, an `a` element will be used as the root node.
   */
  href: a.string,
  /**
   * @ignore
   */
  id: a.string,
  /**
   * If `true`, the loading indicator is visible and the button is disabled.
   * If `true | false`, the loading wrapper is always rendered before the children to prevent [Google Translation Crash](https://github.com/mui/material-ui/issues/27853).
   * @default null
   */
  loading: a.bool,
  /**
   * Element placed before the children if the button is in loading state.
   * The node should contain an element with `role="progressbar"` with an accessible name.
   * By default, it renders a `CircularProgress` that is labeled by the button itself.
   * @default <CircularProgress color="inherit" size={16} />
   */
  loadingIndicator: a.node,
  /**
   * The loading indicator can be positioned on the start, end, or the center of the button.
   * @default 'center'
   */
  loadingPosition: a.oneOf(["center", "end", "start"]),
  /**
   * The size of the component.
   * `small` is equivalent to the dense button styling.
   * @default 'medium'
   */
  size: a.oneOfType([a.oneOf(["small", "medium", "large"]), a.string]),
  /**
   * Element placed before the children.
   */
  startIcon: a.node,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: a.oneOfType([a.arrayOf(a.oneOfType([a.func, a.object, a.bool])), a.func, a.object]),
  /**
   * @ignore
   */
  type: a.oneOfType([a.oneOf(["button", "reset", "submit"]), a.string]),
  /**
   * The variant to use.
   * @default 'text'
   */
  variant: a.oneOfType([a.oneOf(["contained", "outlined", "text"]), a.string])
});
const x1 = ({ children: r, onClick: i, ...o }) => {
  const { setOpen: l, setAnchorEl: f, open: c, buttonId: h, menuId: g } = ws();
  return /* @__PURE__ */ S(
    Bc,
    {
      id: h,
      "aria-controls": c ? g : void 0,
      "aria-haspopup": "true",
      "aria-expanded": c ? "true" : void 0,
      onClick: (b) => {
        f(b.currentTarget), l(!c), i && i(b);
      },
      ...o,
      children: r
    }
  );
};
function _1(r) {
  return _n("MuiIconButton", r);
}
const Pu = wn("MuiIconButton", ["root", "disabled", "colorInherit", "colorPrimary", "colorSecondary", "colorError", "colorInfo", "colorSuccess", "colorWarning", "edgeStart", "edgeEnd", "sizeSmall", "sizeMedium", "sizeLarge", "loading", "loadingIndicator", "loadingWrapper"]), w1 = (r) => {
  const {
    classes: i,
    disabled: o,
    color: l,
    edge: f,
    size: c,
    loading: h
  } = r, g = {
    root: ["root", h && "loading", o && "disabled", l !== "default" && `color${Se(l)}`, f && `edge${Se(f)}`, `size${Se(c)}`],
    loadingIndicator: ["loadingIndicator"],
    loadingWrapper: ["loadingWrapper"]
  };
  return Dn(g, _1, i);
}, E1 = Pe(Cs, {
  name: "MuiIconButton",
  slot: "Root",
  overridesResolver: (r, i) => {
    const {
      ownerState: o
    } = r;
    return [i.root, o.loading && i.loading, o.color !== "default" && i[`color${Se(o.color)}`], o.edge && i[`edge${Se(o.edge)}`], i[`size${Se(o.size)}`]];
  }
})(rt(({
  theme: r
}) => ({
  textAlign: "center",
  flex: "0 0 auto",
  fontSize: r.typography.pxToRem(24),
  padding: 8,
  borderRadius: "50%",
  color: (r.vars || r).palette.action.active,
  transition: r.transitions.create("background-color", {
    duration: r.transitions.duration.shortest
  }),
  variants: [{
    props: (i) => !i.disableRipple,
    style: {
      "--IconButton-hoverBg": r.alpha((r.vars || r).palette.action.active, (r.vars || r).palette.action.hoverOpacity),
      "&:hover": {
        backgroundColor: "var(--IconButton-hoverBg)",
        // Reset on touch devices, it doesn't add specificity
        "@media (hover: none)": {
          backgroundColor: "transparent"
        }
      }
    }
  }, {
    props: {
      edge: "start"
    },
    style: {
      marginLeft: -12
    }
  }, {
    props: {
      edge: "start",
      size: "small"
    },
    style: {
      marginLeft: -3
    }
  }, {
    props: {
      edge: "end"
    },
    style: {
      marginRight: -12
    }
  }, {
    props: {
      edge: "end",
      size: "small"
    },
    style: {
      marginRight: -3
    }
  }]
})), rt(({
  theme: r
}) => ({
  variants: [{
    props: {
      color: "inherit"
    },
    style: {
      color: "inherit"
    }
  }, ...Object.entries(r.palette).filter(Do()).map(([i]) => ({
    props: {
      color: i
    },
    style: {
      color: (r.vars || r).palette[i].main
    }
  })), ...Object.entries(r.palette).filter(Do()).map(([i]) => ({
    props: {
      color: i
    },
    style: {
      "--IconButton-hoverBg": r.alpha((r.vars || r).palette[i].main, (r.vars || r).palette.action.hoverOpacity)
    }
  })), {
    props: {
      size: "small"
    },
    style: {
      padding: 5,
      fontSize: r.typography.pxToRem(18)
    }
  }, {
    props: {
      size: "large"
    },
    style: {
      padding: 12,
      fontSize: r.typography.pxToRem(28)
    }
  }],
  [`&.${Pu.disabled}`]: {
    backgroundColor: "transparent",
    color: (r.vars || r).palette.action.disabled
  },
  [`&.${Pu.loading}`]: {
    color: "transparent"
  }
}))), S1 = Pe("span", {
  name: "MuiIconButton",
  slot: "LoadingIndicator"
})(({
  theme: r
}) => ({
  display: "none",
  position: "absolute",
  visibility: "visible",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  color: (r.vars || r).palette.action.disabled,
  variants: [{
    props: {
      loading: !0
    },
    style: {
      display: "flex"
    }
  }]
})), Fc = /* @__PURE__ */ C.forwardRef(function(i, o) {
  const l = En({
    props: i,
    name: "MuiIconButton"
  }), {
    edge: f = !1,
    children: c,
    className: h,
    color: g = "default",
    disabled: y = !1,
    disableFocusRipple: b = !1,
    size: E = "medium",
    id: R,
    loading: N = null,
    loadingIndicator: M,
    ...A
  } = l, k = ju(R), z = M ?? /* @__PURE__ */ S(Rs, {
    "aria-labelledby": k,
    color: "inherit",
    size: 16
  }), B = {
    ...l,
    edge: f,
    color: g,
    disabled: y,
    disableFocusRipple: b,
    loading: N,
    loadingIndicator: z,
    size: E
  }, H = w1(B);
  return /* @__PURE__ */ fe(E1, {
    id: N ? k : R,
    className: Te(H.root, h),
    centerRipple: !0,
    focusRipple: !b,
    disabled: y || N,
    ref: o,
    ...A,
    ownerState: B,
    children: [typeof N == "boolean" && // use plain HTML span to minimize the runtime overhead
    /* @__PURE__ */ S("span", {
      className: H.loadingWrapper,
      style: {
        display: "contents"
      },
      children: /* @__PURE__ */ S(S1, {
        className: H.loadingIndicator,
        ownerState: B,
        children: N && z
      })
    }), c]
  });
});
process.env.NODE_ENV !== "production" && (Fc.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The icon to display.
   */
  children: Mt(a.node, (r) => C.Children.toArray(r.children).some((o) => /* @__PURE__ */ C.isValidElement(o) && o.props.onClick) ? new Error(["MUI: You are providing an onClick event listener to a child of a button element.", "Prefer applying it to the IconButton directly.", "This guarantees that the whole <button> will be responsive to click events."].join(`
`)) : null),
  /**
   * Override or extend the styles applied to the component.
   */
  classes: a.object,
  /**
   * @ignore
   */
  className: a.string,
  /**
   * The color of the component.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   * @default 'default'
   */
  color: a.oneOfType([a.oneOf(["inherit", "default", "primary", "secondary", "error", "info", "success", "warning"]), a.string]),
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: a.bool,
  /**
   * If `true`, the  keyboard focus ripple is disabled.
   * @default false
   */
  disableFocusRipple: a.bool,
  /**
   * If `true`, the ripple effect is disabled.
   *
   * ⚠️ Without a ripple there is no styling for :focus-visible by default. Be sure
   * to highlight the element by applying separate styles with the `.Mui-focusVisible` class.
   * @default false
   */
  disableRipple: a.bool,
  /**
   * If given, uses a negative margin to counteract the padding on one
   * side (this is often helpful for aligning the left or right
   * side of the icon with content above or below, without ruining the border
   * size and shape).
   * @default false
   */
  edge: a.oneOf(["end", "start", !1]),
  /**
   * @ignore
   */
  id: a.string,
  /**
   * If `true`, the loading indicator is visible and the button is disabled.
   * If `true | false`, the loading wrapper is always rendered before the children to prevent [Google Translation Crash](https://github.com/mui/material-ui/issues/27853).
   * @default null
   */
  loading: a.bool,
  /**
   * Element placed before the children if the button is in loading state.
   * The node should contain an element with `role="progressbar"` with an accessible name.
   * By default, it renders a `CircularProgress` that is labeled by the button itself.
   * @default <CircularProgress color="inherit" size={16} />
   */
  loadingIndicator: a.node,
  /**
   * The size of the component.
   * `small` is equivalent to the dense button styling.
   * @default 'medium'
   */
  size: a.oneOfType([a.oneOf(["small", "medium", "large"]), a.string]),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: a.oneOfType([a.arrayOf(a.oneOfType([a.func, a.object, a.bool])), a.func, a.object])
});
const T1 = ({
  children: r,
  onClick: i,
  ...o
}) => {
  const { setOpen: l, setAnchorEl: f, open: c, buttonId: h, menuId: g } = ws();
  return /* @__PURE__ */ S(
    Fc,
    {
      id: h,
      "aria-controls": c ? g : void 0,
      "aria-haspopup": "true",
      "aria-expanded": c ? "true" : void 0,
      onClick: (b) => {
        f(b.currentTarget), l(!c), i && i(b);
      },
      ...o,
      children: r
    }
  );
}, Is = ({
  children: r,
  id: i,
  open: o,
  setOpen: l
}) => {
  const [f, c] = Jt(!1), [h, g] = Jt(null), y = o !== void 0 && l !== void 0, b = y ? o : f, E = _o(
    (k) => {
      y && l ? l(k) : c(k);
    },
    [y, l]
  ), R = Wu(), N = i ?? `dropdown-${R}`, M = `${N}-button`, A = `${N}-menu`;
  return /* @__PURE__ */ S(
    rc.Provider,
    {
      value: {
        open: b,
        setOpen: E,
        anchorEl: h,
        setAnchorEl: g,
        buttonId: M,
        menuId: A
      },
      children: r
    }
  );
};
Is.Menu = Gb;
Is.Button = x1;
Is.IconButton = T1;
const C1 = Lu(Du)(({ theme: r }) => ({
  [`&.${Ln.alternativeLabel}`]: {
    top: 10,
    left: "calc(-50% + 12px)",
    right: "calc(50% + 12px)"
  },
  [`&.${Ln.active}`]: {
    [`& .${Ln.line}`]: {
      borderColor: r.palette.primary.main
    }
  },
  [`&.${Ln.completed}`]: {
    [`& .${Ln.line}`]: {
      borderColor: r.palette.primary.main
    }
  },
  [`& .${Ln.line}`]: {
    borderColor: r.palette.grey[300],
    borderLeftWidth: 2,
    minHeight: 24
  }
})), R1 = (r) => {
  const { active: i, completed: o } = r;
  return /* @__PURE__ */ S(
    ee,
    {
      sx: {
        width: 24,
        height: 24,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: o ? "primary.main" : "transparent",
        border: o ? "none" : "2px solid",
        borderColor: i ? "primary.main" : "divider",
        color: o ? "background.default" : "transparent",
        flexShrink: 0,
        marginLeft: "1px"
      },
      children: o && /* @__PURE__ */ S(tc, { sx: { fontSize: 16 } })
    }
  );
}, q1 = ({
  header: r,
  steps: i,
  activeStep: o = 0,
  actions: l,
  showCompletionCount: f = !0,
  sx: c,
  className: h
}) => {
  const g = i.filter((b) => b.completed).length, y = i.length;
  return /* @__PURE__ */ fe(
    ko,
    {
      variant: "outlined",
      elevation: 0,
      sx: {
        p: 2,
        ...c
      },
      className: h,
      children: [
        r && /* @__PURE__ */ fe(
          ee,
          {
            sx: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3
            },
            children: [
              /* @__PURE__ */ S(Be, { variant: "h6", sx: { fontWeight: 600 }, children: r }),
              f && /* @__PURE__ */ fe(Be, { variant: "body2", color: "text.secondary", children: [
                g,
                " of ",
                y,
                " completed"
              ] })
            ]
          }
        ),
        /* @__PURE__ */ S(
          ku,
          {
            activeStep: o,
            orientation: "vertical",
            connector: /* @__PURE__ */ S(C1, {}),
            sx: {
              "& .MuiStepContent-root": {
                borderWidth: "2px",
                borderColor: "divider",
                ml: "12px",
                pl: "23px"
              },
              "& .MuiStep-root": {
                pb: 0
              }
            },
            children: i.map((b, E) => /* @__PURE__ */ fe(
              Bu,
              {
                completed: b.completed,
                sx: {
                  "&:last-child .MuiStepLabel-iconContainer:before": {
                    display: "none"
                  }
                },
                children: [
                  /* @__PURE__ */ S(
                    Fu,
                    {
                      slots: { stepIcon: R1 },
                      sx: {
                        alignItems: "flex-start",
                        py: 0,
                        "& .MuiStepLabel-iconContainer": {
                          pt: 0.25,
                          position: "relative"
                        },
                        "& .MuiStepLabel-iconContainer > *": {
                          position: "relative"
                        },
                        "& .MuiStepLabel-iconContainer:before": {
                          content: '""',
                          position: "absolute",
                          top: "calc(100% + 2px)",
                          left: "calc(50% - 4px)",
                          width: "2px",
                          height: "calc(100% - 2px)",
                          backgroundColor: b.completed ? "primary.main" : "grey.300"
                        },
                        "& .MuiStepLabel-labelContainer": {
                          ml: 0.5
                        }
                      },
                      children: /* @__PURE__ */ S(
                        Be,
                        {
                          variant: "body1",
                          sx: {
                            fontWeight: 500,
                            pt: 0.5,
                            lineHeight: 1.3
                          },
                          children: b.label
                        }
                      )
                    }
                  ),
                  b.description && /* @__PURE__ */ S(z0, { children: /* @__PURE__ */ S(Be, { variant: "body2", sx: { mt: 0.5, pr: 2 }, children: b.description }) })
                ]
              },
              E
            ))
          }
        ),
        l && /* @__PURE__ */ S(ee, { sx: { mt: 3, display: "flex", justifyContent: "center" }, children: l })
      ]
    }
  );
};
function Y1({
  children: r,
  popoverContent: i,
  popoverProps: o = {},
  disabled: l = !1,
  anchorOrigin: f = {
    vertical: "bottom",
    horizontal: "left"
  },
  transformOrigin: c = {
    vertical: -8,
    horizontal: "left"
  },
  sx: h,
  className: g
}) {
  const b = `accessible-popover-${Wu()}`, [E, R] = Jt(null), N = (B) => {
    l || R(B.currentTarget);
  }, M = () => {
    R(null);
  }, A = !!E && !l, z = wr(r, {
    "aria-describedby": l ? void 0 : b,
    onMouseEnter: N,
    onMouseLeave: M
  });
  return l ? r : /* @__PURE__ */ fe(S0, { children: [
    z,
    /* @__PURE__ */ S(
      W0,
      {
        id: b,
        sx: { pointerEvents: "none", ...h },
        className: g,
        open: A,
        anchorEl: E,
        onClose: M,
        elevation: 3,
        anchorOrigin: f,
        transformOrigin: c,
        disableRestoreFocus: !0,
        ...o,
        children: i
      }
    )
  ] });
}
var _r = { exports: {} };
var I1 = _r.exports, Mu;
function O1() {
  return Mu || (Mu = 1, (function(r, i) {
    (function() {
      var o, l = "4.17.21", f = 200, c = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", h = "Expected a function", g = "Invalid `variable` option passed into `_.template`", y = "__lodash_hash_undefined__", b = 500, E = "__lodash_placeholder__", R = 1, N = 2, M = 4, A = 1, k = 2, z = 1, B = 2, H = 4, L = 8, D = 16, U = 32, q = 64, W = 128, G = 256, Z = 512, ge = 30, de = "...", se = 800, re = 16, te = 1, $ = 2, K = 3, le = 1 / 0, Ce = 9007199254740991, X = 17976931348623157e292, we = NaN, Me = 4294967295, je = Me - 1, Hn = Me >>> 1, Sn = [
        ["ary", W],
        ["bind", z],
        ["bindKey", B],
        ["curry", L],
        ["curryRight", D],
        ["flip", Z],
        ["partial", U],
        ["partialRight", q],
        ["rearg", G]
      ], rn = "[object Arguments]", kn = "[object Array]", ht = "[object AsyncFunction]", Tn = "[object Boolean]", Cn = "[object Date]", ve = "[object DOMException]", ye = "[object Error]", Le = "[object Function]", fn = "[object GeneratorFunction]", De = "[object Map]", Je = "[object Number]", At = "[object Null]", He = "[object Object]", Rn = "[object Promise]", Vn = "[object Proxy]", In = "[object RegExp]", Ie = "[object Set]", ne = "[object String]", Ir = "[object Symbol]", zc = "[object Undefined]", er = "[object WeakMap]", Wc = "[object WeakSet]", nr = "[object ArrayBuffer]", Nt = "[object DataView]", zo = "[object Float32Array]", Wo = "[object Float64Array]", Uo = "[object Int8Array]", Ho = "[object Int16Array]", Vo = "[object Int32Array]", Go = "[object Uint8Array]", Ko = "[object Uint8ClampedArray]", qo = "[object Uint16Array]", Yo = "[object Uint32Array]", Uc = /\b__p \+= '';/g, Hc = /\b(__p \+=) '' \+/g, Vc = /(__e\(.*?\)|\b__t\)) \+\n'';/g, Os = /&(?:amp|lt|gt|quot|#39);/g, Ps = /[&<>"']/g, Gc = RegExp(Os.source), Kc = RegExp(Ps.source), qc = /<%-([\s\S]+?)%>/g, Yc = /<%([\s\S]+?)%>/g, Ms = /<%=([\s\S]+?)%>/g, Xc = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, Zc = /^\w*$/, jc = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, Xo = /[\\^$.*+?()[\]{}|]/g, Jc = RegExp(Xo.source), Zo = /^\s+/, Qc = /\s/, ef = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, nf = /\{\n\/\* \[wrapped with (.+)\] \*/, tf = /,? & /, rf = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g, of = /[()=,{}\[\]\/\s]/, sf = /\\(\\)?/g, af = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g, As = /\w*$/, lf = /^[-+]0x[0-9a-f]+$/i, uf = /^0b[01]+$/i, cf = /^\[object .+?Constructor\]$/, ff = /^0o[0-7]+$/i, df = /^(?:0|[1-9]\d*)$/, pf = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, Or = /($^)/, hf = /['\n\r\u2028\u2029\\]/g, Pr = "\\ud800-\\udfff", gf = "\\u0300-\\u036f", mf = "\\ufe20-\\ufe2f", vf = "\\u20d0-\\u20ff", Ns = gf + mf + vf, Ls = "\\u2700-\\u27bf", Ds = "a-z\\xdf-\\xf6\\xf8-\\xff", yf = "\\xac\\xb1\\xd7\\xf7", bf = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", xf = "\\u2000-\\u206f", _f = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", ks = "A-Z\\xc0-\\xd6\\xd8-\\xde", Bs = "\\ufe0e\\ufe0f", Fs = yf + bf + xf + _f, jo = "['’]", wf = "[" + Pr + "]", $s = "[" + Fs + "]", Mr = "[" + Ns + "]", zs = "\\d+", Ef = "[" + Ls + "]", Ws = "[" + Ds + "]", Us = "[^" + Pr + Fs + zs + Ls + Ds + ks + "]", Jo = "\\ud83c[\\udffb-\\udfff]", Sf = "(?:" + Mr + "|" + Jo + ")", Hs = "[^" + Pr + "]", Qo = "(?:\\ud83c[\\udde6-\\uddff]){2}", ei = "[\\ud800-\\udbff][\\udc00-\\udfff]", Lt = "[" + ks + "]", Vs = "\\u200d", Gs = "(?:" + Ws + "|" + Us + ")", Tf = "(?:" + Lt + "|" + Us + ")", Ks = "(?:" + jo + "(?:d|ll|m|re|s|t|ve))?", qs = "(?:" + jo + "(?:D|LL|M|RE|S|T|VE))?", Ys = Sf + "?", Xs = "[" + Bs + "]?", Cf = "(?:" + Vs + "(?:" + [Hs, Qo, ei].join("|") + ")" + Xs + Ys + ")*", Rf = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", If = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", Zs = Xs + Ys + Cf, Of = "(?:" + [Ef, Qo, ei].join("|") + ")" + Zs, Pf = "(?:" + [Hs + Mr + "?", Mr, Qo, ei, wf].join("|") + ")", Mf = RegExp(jo, "g"), Af = RegExp(Mr, "g"), ni = RegExp(Jo + "(?=" + Jo + ")|" + Pf + Zs, "g"), Nf = RegExp([
        Lt + "?" + Ws + "+" + Ks + "(?=" + [$s, Lt, "$"].join("|") + ")",
        Tf + "+" + qs + "(?=" + [$s, Lt + Gs, "$"].join("|") + ")",
        Lt + "?" + Gs + "+" + Ks,
        Lt + "+" + qs,
        If,
        Rf,
        zs,
        Of
      ].join("|"), "g"), Lf = RegExp("[" + Vs + Pr + Ns + Bs + "]"), Df = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/, kf = [
        "Array",
        "Buffer",
        "DataView",
        "Date",
        "Error",
        "Float32Array",
        "Float64Array",
        "Function",
        "Int8Array",
        "Int16Array",
        "Int32Array",
        "Map",
        "Math",
        "Object",
        "Promise",
        "RegExp",
        "Set",
        "String",
        "Symbol",
        "TypeError",
        "Uint8Array",
        "Uint8ClampedArray",
        "Uint16Array",
        "Uint32Array",
        "WeakMap",
        "_",
        "clearTimeout",
        "isFinite",
        "parseInt",
        "setTimeout"
      ], Bf = -1, Oe = {};
      Oe[zo] = Oe[Wo] = Oe[Uo] = Oe[Ho] = Oe[Vo] = Oe[Go] = Oe[Ko] = Oe[qo] = Oe[Yo] = !0, Oe[rn] = Oe[kn] = Oe[nr] = Oe[Tn] = Oe[Nt] = Oe[Cn] = Oe[ye] = Oe[Le] = Oe[De] = Oe[Je] = Oe[He] = Oe[In] = Oe[Ie] = Oe[ne] = Oe[er] = !1;
      var Re = {};
      Re[rn] = Re[kn] = Re[nr] = Re[Nt] = Re[Tn] = Re[Cn] = Re[zo] = Re[Wo] = Re[Uo] = Re[Ho] = Re[Vo] = Re[De] = Re[Je] = Re[He] = Re[In] = Re[Ie] = Re[ne] = Re[Ir] = Re[Go] = Re[Ko] = Re[qo] = Re[Yo] = !0, Re[ye] = Re[Le] = Re[er] = !1;
      var Ff = {
        // Latin-1 Supplement block.
        À: "A",
        Á: "A",
        Â: "A",
        Ã: "A",
        Ä: "A",
        Å: "A",
        à: "a",
        á: "a",
        â: "a",
        ã: "a",
        ä: "a",
        å: "a",
        Ç: "C",
        ç: "c",
        Ð: "D",
        ð: "d",
        È: "E",
        É: "E",
        Ê: "E",
        Ë: "E",
        è: "e",
        é: "e",
        ê: "e",
        ë: "e",
        Ì: "I",
        Í: "I",
        Î: "I",
        Ï: "I",
        ì: "i",
        í: "i",
        î: "i",
        ï: "i",
        Ñ: "N",
        ñ: "n",
        Ò: "O",
        Ó: "O",
        Ô: "O",
        Õ: "O",
        Ö: "O",
        Ø: "O",
        ò: "o",
        ó: "o",
        ô: "o",
        õ: "o",
        ö: "o",
        ø: "o",
        Ù: "U",
        Ú: "U",
        Û: "U",
        Ü: "U",
        ù: "u",
        ú: "u",
        û: "u",
        ü: "u",
        Ý: "Y",
        ý: "y",
        ÿ: "y",
        Æ: "Ae",
        æ: "ae",
        Þ: "Th",
        þ: "th",
        ß: "ss",
        // Latin Extended-A block.
        Ā: "A",
        Ă: "A",
        Ą: "A",
        ā: "a",
        ă: "a",
        ą: "a",
        Ć: "C",
        Ĉ: "C",
        Ċ: "C",
        Č: "C",
        ć: "c",
        ĉ: "c",
        ċ: "c",
        č: "c",
        Ď: "D",
        Đ: "D",
        ď: "d",
        đ: "d",
        Ē: "E",
        Ĕ: "E",
        Ė: "E",
        Ę: "E",
        Ě: "E",
        ē: "e",
        ĕ: "e",
        ė: "e",
        ę: "e",
        ě: "e",
        Ĝ: "G",
        Ğ: "G",
        Ġ: "G",
        Ģ: "G",
        ĝ: "g",
        ğ: "g",
        ġ: "g",
        ģ: "g",
        Ĥ: "H",
        Ħ: "H",
        ĥ: "h",
        ħ: "h",
        Ĩ: "I",
        Ī: "I",
        Ĭ: "I",
        Į: "I",
        İ: "I",
        ĩ: "i",
        ī: "i",
        ĭ: "i",
        į: "i",
        ı: "i",
        Ĵ: "J",
        ĵ: "j",
        Ķ: "K",
        ķ: "k",
        ĸ: "k",
        Ĺ: "L",
        Ļ: "L",
        Ľ: "L",
        Ŀ: "L",
        Ł: "L",
        ĺ: "l",
        ļ: "l",
        ľ: "l",
        ŀ: "l",
        ł: "l",
        Ń: "N",
        Ņ: "N",
        Ň: "N",
        Ŋ: "N",
        ń: "n",
        ņ: "n",
        ň: "n",
        ŋ: "n",
        Ō: "O",
        Ŏ: "O",
        Ő: "O",
        ō: "o",
        ŏ: "o",
        ő: "o",
        Ŕ: "R",
        Ŗ: "R",
        Ř: "R",
        ŕ: "r",
        ŗ: "r",
        ř: "r",
        Ś: "S",
        Ŝ: "S",
        Ş: "S",
        Š: "S",
        ś: "s",
        ŝ: "s",
        ş: "s",
        š: "s",
        Ţ: "T",
        Ť: "T",
        Ŧ: "T",
        ţ: "t",
        ť: "t",
        ŧ: "t",
        Ũ: "U",
        Ū: "U",
        Ŭ: "U",
        Ů: "U",
        Ű: "U",
        Ų: "U",
        ũ: "u",
        ū: "u",
        ŭ: "u",
        ů: "u",
        ű: "u",
        ų: "u",
        Ŵ: "W",
        ŵ: "w",
        Ŷ: "Y",
        ŷ: "y",
        Ÿ: "Y",
        Ź: "Z",
        Ż: "Z",
        Ž: "Z",
        ź: "z",
        ż: "z",
        ž: "z",
        Ĳ: "IJ",
        ĳ: "ij",
        Œ: "Oe",
        œ: "oe",
        ŉ: "'n",
        ſ: "s"
      }, $f = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }, zf = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'"
      }, Wf = {
        "\\": "\\",
        "'": "'",
        "\n": "n",
        "\r": "r",
        "\u2028": "u2028",
        "\u2029": "u2029"
      }, Uf = parseFloat, Hf = parseInt, js = typeof yo == "object" && yo && yo.Object === Object && yo, Vf = typeof self == "object" && self && self.Object === Object && self, Ve = js || Vf || Function("return this")(), ti = i && !i.nodeType && i, gt = ti && !0 && r && !r.nodeType && r, Js = gt && gt.exports === ti, ri = Js && js.process, dn = (function() {
        try {
          var x = gt && gt.require && gt.require("util").types;
          return x || ri && ri.binding && ri.binding("util");
        } catch {
        }
      })(), Qs = dn && dn.isArrayBuffer, ea = dn && dn.isDate, na = dn && dn.isMap, ta = dn && dn.isRegExp, ra = dn && dn.isSet, oa = dn && dn.isTypedArray;
      function on(x, T, w) {
        switch (w.length) {
          case 0:
            return x.call(T);
          case 1:
            return x.call(T, w[0]);
          case 2:
            return x.call(T, w[0], w[1]);
          case 3:
            return x.call(T, w[0], w[1], w[2]);
        }
        return x.apply(T, w);
      }
      function Gf(x, T, w, V) {
        for (var oe = -1, be = x == null ? 0 : x.length; ++oe < be; ) {
          var ze = x[oe];
          T(V, ze, w(ze), x);
        }
        return V;
      }
      function pn(x, T) {
        for (var w = -1, V = x == null ? 0 : x.length; ++w < V && T(x[w], w, x) !== !1; )
          ;
        return x;
      }
      function Kf(x, T) {
        for (var w = x == null ? 0 : x.length; w-- && T(x[w], w, x) !== !1; )
          ;
        return x;
      }
      function ia(x, T) {
        for (var w = -1, V = x == null ? 0 : x.length; ++w < V; )
          if (!T(x[w], w, x))
            return !1;
        return !0;
      }
      function ot(x, T) {
        for (var w = -1, V = x == null ? 0 : x.length, oe = 0, be = []; ++w < V; ) {
          var ze = x[w];
          T(ze, w, x) && (be[oe++] = ze);
        }
        return be;
      }
      function Ar(x, T) {
        var w = x == null ? 0 : x.length;
        return !!w && Dt(x, T, 0) > -1;
      }
      function oi(x, T, w) {
        for (var V = -1, oe = x == null ? 0 : x.length; ++V < oe; )
          if (w(T, x[V]))
            return !0;
        return !1;
      }
      function Ae(x, T) {
        for (var w = -1, V = x == null ? 0 : x.length, oe = Array(V); ++w < V; )
          oe[w] = T(x[w], w, x);
        return oe;
      }
      function it(x, T) {
        for (var w = -1, V = T.length, oe = x.length; ++w < V; )
          x[oe + w] = T[w];
        return x;
      }
      function ii(x, T, w, V) {
        var oe = -1, be = x == null ? 0 : x.length;
        for (V && be && (w = x[++oe]); ++oe < be; )
          w = T(w, x[oe], oe, x);
        return w;
      }
      function qf(x, T, w, V) {
        var oe = x == null ? 0 : x.length;
        for (V && oe && (w = x[--oe]); oe--; )
          w = T(w, x[oe], oe, x);
        return w;
      }
      function si(x, T) {
        for (var w = -1, V = x == null ? 0 : x.length; ++w < V; )
          if (T(x[w], w, x))
            return !0;
        return !1;
      }
      var Yf = ai("length");
      function Xf(x) {
        return x.split("");
      }
      function Zf(x) {
        return x.match(rf) || [];
      }
      function sa(x, T, w) {
        var V;
        return w(x, function(oe, be, ze) {
          if (T(oe, be, ze))
            return V = be, !1;
        }), V;
      }
      function Nr(x, T, w, V) {
        for (var oe = x.length, be = w + (V ? 1 : -1); V ? be-- : ++be < oe; )
          if (T(x[be], be, x))
            return be;
        return -1;
      }
      function Dt(x, T, w) {
        return T === T ? ld(x, T, w) : Nr(x, aa, w);
      }
      function jf(x, T, w, V) {
        for (var oe = w - 1, be = x.length; ++oe < be; )
          if (V(x[oe], T))
            return oe;
        return -1;
      }
      function aa(x) {
        return x !== x;
      }
      function la(x, T) {
        var w = x == null ? 0 : x.length;
        return w ? ui(x, T) / w : we;
      }
      function ai(x) {
        return function(T) {
          return T == null ? o : T[x];
        };
      }
      function li(x) {
        return function(T) {
          return x == null ? o : x[T];
        };
      }
      function ua(x, T, w, V, oe) {
        return oe(x, function(be, ze, Ee) {
          w = V ? (V = !1, be) : T(w, be, ze, Ee);
        }), w;
      }
      function Jf(x, T) {
        var w = x.length;
        for (x.sort(T); w--; )
          x[w] = x[w].value;
        return x;
      }
      function ui(x, T) {
        for (var w, V = -1, oe = x.length; ++V < oe; ) {
          var be = T(x[V]);
          be !== o && (w = w === o ? be : w + be);
        }
        return w;
      }
      function ci(x, T) {
        for (var w = -1, V = Array(x); ++w < x; )
          V[w] = T(w);
        return V;
      }
      function Qf(x, T) {
        return Ae(T, function(w) {
          return [w, x[w]];
        });
      }
      function ca(x) {
        return x && x.slice(0, ha(x) + 1).replace(Zo, "");
      }
      function sn(x) {
        return function(T) {
          return x(T);
        };
      }
      function fi(x, T) {
        return Ae(T, function(w) {
          return x[w];
        });
      }
      function tr(x, T) {
        return x.has(T);
      }
      function fa(x, T) {
        for (var w = -1, V = x.length; ++w < V && Dt(T, x[w], 0) > -1; )
          ;
        return w;
      }
      function da(x, T) {
        for (var w = x.length; w-- && Dt(T, x[w], 0) > -1; )
          ;
        return w;
      }
      function ed(x, T) {
        for (var w = x.length, V = 0; w--; )
          x[w] === T && ++V;
        return V;
      }
      var nd = li(Ff), td = li($f);
      function rd(x) {
        return "\\" + Wf[x];
      }
      function od(x, T) {
        return x == null ? o : x[T];
      }
      function kt(x) {
        return Lf.test(x);
      }
      function id(x) {
        return Df.test(x);
      }
      function sd(x) {
        for (var T, w = []; !(T = x.next()).done; )
          w.push(T.value);
        return w;
      }
      function di(x) {
        var T = -1, w = Array(x.size);
        return x.forEach(function(V, oe) {
          w[++T] = [oe, V];
        }), w;
      }
      function pa(x, T) {
        return function(w) {
          return x(T(w));
        };
      }
      function st(x, T) {
        for (var w = -1, V = x.length, oe = 0, be = []; ++w < V; ) {
          var ze = x[w];
          (ze === T || ze === E) && (x[w] = E, be[oe++] = w);
        }
        return be;
      }
      function Lr(x) {
        var T = -1, w = Array(x.size);
        return x.forEach(function(V) {
          w[++T] = V;
        }), w;
      }
      function ad(x) {
        var T = -1, w = Array(x.size);
        return x.forEach(function(V) {
          w[++T] = [V, V];
        }), w;
      }
      function ld(x, T, w) {
        for (var V = w - 1, oe = x.length; ++V < oe; )
          if (x[V] === T)
            return V;
        return -1;
      }
      function ud(x, T, w) {
        for (var V = w + 1; V--; )
          if (x[V] === T)
            return V;
        return V;
      }
      function Bt(x) {
        return kt(x) ? fd(x) : Yf(x);
      }
      function On(x) {
        return kt(x) ? dd(x) : Xf(x);
      }
      function ha(x) {
        for (var T = x.length; T-- && Qc.test(x.charAt(T)); )
          ;
        return T;
      }
      var cd = li(zf);
      function fd(x) {
        for (var T = ni.lastIndex = 0; ni.test(x); )
          ++T;
        return T;
      }
      function dd(x) {
        return x.match(ni) || [];
      }
      function pd(x) {
        return x.match(Nf) || [];
      }
      var hd = (function x(T) {
        T = T == null ? Ve : Ft.defaults(Ve.Object(), T, Ft.pick(Ve, kf));
        var w = T.Array, V = T.Date, oe = T.Error, be = T.Function, ze = T.Math, Ee = T.Object, pi = T.RegExp, gd = T.String, hn = T.TypeError, Dr = w.prototype, md = be.prototype, $t = Ee.prototype, kr = T["__core-js_shared__"], Br = md.toString, _e = $t.hasOwnProperty, vd = 0, ga = (function() {
          var e = /[^.]+$/.exec(kr && kr.keys && kr.keys.IE_PROTO || "");
          return e ? "Symbol(src)_1." + e : "";
        })(), Fr = $t.toString, yd = Br.call(Ee), bd = Ve._, xd = pi(
          "^" + Br.call(_e).replace(Xo, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
        ), $r = Js ? T.Buffer : o, at = T.Symbol, zr = T.Uint8Array, ma = $r ? $r.allocUnsafe : o, Wr = pa(Ee.getPrototypeOf, Ee), va = Ee.create, ya = $t.propertyIsEnumerable, Ur = Dr.splice, ba = at ? at.isConcatSpreadable : o, rr = at ? at.iterator : o, mt = at ? at.toStringTag : o, Hr = (function() {
          try {
            var e = _t(Ee, "defineProperty");
            return e({}, "", {}), e;
          } catch {
          }
        })(), _d = T.clearTimeout !== Ve.clearTimeout && T.clearTimeout, wd = V && V.now !== Ve.Date.now && V.now, Ed = T.setTimeout !== Ve.setTimeout && T.setTimeout, Vr = ze.ceil, Gr = ze.floor, hi = Ee.getOwnPropertySymbols, Sd = $r ? $r.isBuffer : o, xa = T.isFinite, Td = Dr.join, Cd = pa(Ee.keys, Ee), We = ze.max, Ke = ze.min, Rd = V.now, Id = T.parseInt, _a = ze.random, Od = Dr.reverse, gi = _t(T, "DataView"), or = _t(T, "Map"), mi = _t(T, "Promise"), zt = _t(T, "Set"), ir = _t(T, "WeakMap"), sr = _t(Ee, "create"), Kr = ir && new ir(), Wt = {}, Pd = wt(gi), Md = wt(or), Ad = wt(mi), Nd = wt(zt), Ld = wt(ir), qr = at ? at.prototype : o, ar = qr ? qr.valueOf : o, wa = qr ? qr.toString : o;
        function d(e) {
          if (ke(e) && !ie(e) && !(e instanceof he)) {
            if (e instanceof gn)
              return e;
            if (_e.call(e, "__wrapped__"))
              return El(e);
          }
          return new gn(e);
        }
        var Ut = /* @__PURE__ */ (function() {
          function e() {
          }
          return function(n) {
            if (!Ne(n))
              return {};
            if (va)
              return va(n);
            e.prototype = n;
            var t = new e();
            return e.prototype = o, t;
          };
        })();
        function Yr() {
        }
        function gn(e, n) {
          this.__wrapped__ = e, this.__actions__ = [], this.__chain__ = !!n, this.__index__ = 0, this.__values__ = o;
        }
        d.templateSettings = {
          /**
           * Used to detect `data` property values to be HTML-escaped.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          escape: qc,
          /**
           * Used to detect code to be evaluated.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          evaluate: Yc,
          /**
           * Used to detect `data` property values to inject.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          interpolate: Ms,
          /**
           * Used to reference the data object in the template text.
           *
           * @memberOf _.templateSettings
           * @type {string}
           */
          variable: "",
          /**
           * Used to import variables into the compiled template.
           *
           * @memberOf _.templateSettings
           * @type {Object}
           */
          imports: {
            /**
             * A reference to the `lodash` function.
             *
             * @memberOf _.templateSettings.imports
             * @type {Function}
             */
            _: d
          }
        }, d.prototype = Yr.prototype, d.prototype.constructor = d, gn.prototype = Ut(Yr.prototype), gn.prototype.constructor = gn;
        function he(e) {
          this.__wrapped__ = e, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = Me, this.__views__ = [];
        }
        function Dd() {
          var e = new he(this.__wrapped__);
          return e.__actions__ = Qe(this.__actions__), e.__dir__ = this.__dir__, e.__filtered__ = this.__filtered__, e.__iteratees__ = Qe(this.__iteratees__), e.__takeCount__ = this.__takeCount__, e.__views__ = Qe(this.__views__), e;
        }
        function kd() {
          if (this.__filtered__) {
            var e = new he(this);
            e.__dir__ = -1, e.__filtered__ = !0;
          } else
            e = this.clone(), e.__dir__ *= -1;
          return e;
        }
        function Bd() {
          var e = this.__wrapped__.value(), n = this.__dir__, t = ie(e), s = n < 0, u = t ? e.length : 0, p = Xp(0, u, this.__views__), m = p.start, v = p.end, _ = v - m, I = s ? v : m - 1, O = this.__iteratees__, P = O.length, F = 0, Y = Ke(_, this.__takeCount__);
          if (!t || !s && u == _ && Y == _)
            return Ka(e, this.__actions__);
          var J = [];
          e:
            for (; _-- && F < Y; ) {
              I += n;
              for (var ue = -1, Q = e[I]; ++ue < P; ) {
                var pe = O[ue], me = pe.iteratee, un = pe.type, Ze = me(Q);
                if (un == $)
                  Q = Ze;
                else if (!Ze) {
                  if (un == te)
                    continue e;
                  break e;
                }
              }
              J[F++] = Q;
            }
          return J;
        }
        he.prototype = Ut(Yr.prototype), he.prototype.constructor = he;
        function vt(e) {
          var n = -1, t = e == null ? 0 : e.length;
          for (this.clear(); ++n < t; ) {
            var s = e[n];
            this.set(s[0], s[1]);
          }
        }
        function Fd() {
          this.__data__ = sr ? sr(null) : {}, this.size = 0;
        }
        function $d(e) {
          var n = this.has(e) && delete this.__data__[e];
          return this.size -= n ? 1 : 0, n;
        }
        function zd(e) {
          var n = this.__data__;
          if (sr) {
            var t = n[e];
            return t === y ? o : t;
          }
          return _e.call(n, e) ? n[e] : o;
        }
        function Wd(e) {
          var n = this.__data__;
          return sr ? n[e] !== o : _e.call(n, e);
        }
        function Ud(e, n) {
          var t = this.__data__;
          return this.size += this.has(e) ? 0 : 1, t[e] = sr && n === o ? y : n, this;
        }
        vt.prototype.clear = Fd, vt.prototype.delete = $d, vt.prototype.get = zd, vt.prototype.has = Wd, vt.prototype.set = Ud;
        function Gn(e) {
          var n = -1, t = e == null ? 0 : e.length;
          for (this.clear(); ++n < t; ) {
            var s = e[n];
            this.set(s[0], s[1]);
          }
        }
        function Hd() {
          this.__data__ = [], this.size = 0;
        }
        function Vd(e) {
          var n = this.__data__, t = Xr(n, e);
          if (t < 0)
            return !1;
          var s = n.length - 1;
          return t == s ? n.pop() : Ur.call(n, t, 1), --this.size, !0;
        }
        function Gd(e) {
          var n = this.__data__, t = Xr(n, e);
          return t < 0 ? o : n[t][1];
        }
        function Kd(e) {
          return Xr(this.__data__, e) > -1;
        }
        function qd(e, n) {
          var t = this.__data__, s = Xr(t, e);
          return s < 0 ? (++this.size, t.push([e, n])) : t[s][1] = n, this;
        }
        Gn.prototype.clear = Hd, Gn.prototype.delete = Vd, Gn.prototype.get = Gd, Gn.prototype.has = Kd, Gn.prototype.set = qd;
        function Kn(e) {
          var n = -1, t = e == null ? 0 : e.length;
          for (this.clear(); ++n < t; ) {
            var s = e[n];
            this.set(s[0], s[1]);
          }
        }
        function Yd() {
          this.size = 0, this.__data__ = {
            hash: new vt(),
            map: new (or || Gn)(),
            string: new vt()
          };
        }
        function Xd(e) {
          var n = ao(this, e).delete(e);
          return this.size -= n ? 1 : 0, n;
        }
        function Zd(e) {
          return ao(this, e).get(e);
        }
        function jd(e) {
          return ao(this, e).has(e);
        }
        function Jd(e, n) {
          var t = ao(this, e), s = t.size;
          return t.set(e, n), this.size += t.size == s ? 0 : 1, this;
        }
        Kn.prototype.clear = Yd, Kn.prototype.delete = Xd, Kn.prototype.get = Zd, Kn.prototype.has = jd, Kn.prototype.set = Jd;
        function yt(e) {
          var n = -1, t = e == null ? 0 : e.length;
          for (this.__data__ = new Kn(); ++n < t; )
            this.add(e[n]);
        }
        function Qd(e) {
          return this.__data__.set(e, y), this;
        }
        function ep(e) {
          return this.__data__.has(e);
        }
        yt.prototype.add = yt.prototype.push = Qd, yt.prototype.has = ep;
        function Pn(e) {
          var n = this.__data__ = new Gn(e);
          this.size = n.size;
        }
        function np() {
          this.__data__ = new Gn(), this.size = 0;
        }
        function tp(e) {
          var n = this.__data__, t = n.delete(e);
          return this.size = n.size, t;
        }
        function rp(e) {
          return this.__data__.get(e);
        }
        function op(e) {
          return this.__data__.has(e);
        }
        function ip(e, n) {
          var t = this.__data__;
          if (t instanceof Gn) {
            var s = t.__data__;
            if (!or || s.length < f - 1)
              return s.push([e, n]), this.size = ++t.size, this;
            t = this.__data__ = new Kn(s);
          }
          return t.set(e, n), this.size = t.size, this;
        }
        Pn.prototype.clear = np, Pn.prototype.delete = tp, Pn.prototype.get = rp, Pn.prototype.has = op, Pn.prototype.set = ip;
        function Ea(e, n) {
          var t = ie(e), s = !t && Et(e), u = !t && !s && dt(e), p = !t && !s && !u && Kt(e), m = t || s || u || p, v = m ? ci(e.length, gd) : [], _ = v.length;
          for (var I in e)
            (n || _e.call(e, I)) && !(m && // Safari 9 has enumerable `arguments.length` in strict mode.
            (I == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
            u && (I == "offset" || I == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
            p && (I == "buffer" || I == "byteLength" || I == "byteOffset") || // Skip index properties.
            Zn(I, _))) && v.push(I);
          return v;
        }
        function Sa(e) {
          var n = e.length;
          return n ? e[Ri(0, n - 1)] : o;
        }
        function sp(e, n) {
          return lo(Qe(e), bt(n, 0, e.length));
        }
        function ap(e) {
          return lo(Qe(e));
        }
        function vi(e, n, t) {
          (t !== o && !Mn(e[n], t) || t === o && !(n in e)) && qn(e, n, t);
        }
        function lr(e, n, t) {
          var s = e[n];
          (!(_e.call(e, n) && Mn(s, t)) || t === o && !(n in e)) && qn(e, n, t);
        }
        function Xr(e, n) {
          for (var t = e.length; t--; )
            if (Mn(e[t][0], n))
              return t;
          return -1;
        }
        function lp(e, n, t, s) {
          return lt(e, function(u, p, m) {
            n(s, u, t(u), m);
          }), s;
        }
        function Ta(e, n) {
          return e && Fn(n, Ue(n), e);
        }
        function up(e, n) {
          return e && Fn(n, nn(n), e);
        }
        function qn(e, n, t) {
          n == "__proto__" && Hr ? Hr(e, n, {
            configurable: !0,
            enumerable: !0,
            value: t,
            writable: !0
          }) : e[n] = t;
        }
        function yi(e, n) {
          for (var t = -1, s = n.length, u = w(s), p = e == null; ++t < s; )
            u[t] = p ? o : Ji(e, n[t]);
          return u;
        }
        function bt(e, n, t) {
          return e === e && (t !== o && (e = e <= t ? e : t), n !== o && (e = e >= n ? e : n)), e;
        }
        function mn(e, n, t, s, u, p) {
          var m, v = n & R, _ = n & N, I = n & M;
          if (t && (m = u ? t(e, s, u, p) : t(e)), m !== o)
            return m;
          if (!Ne(e))
            return e;
          var O = ie(e);
          if (O) {
            if (m = jp(e), !v)
              return Qe(e, m);
          } else {
            var P = qe(e), F = P == Le || P == fn;
            if (dt(e))
              return Xa(e, v);
            if (P == He || P == rn || F && !u) {
              if (m = _ || F ? {} : hl(e), !v)
                return _ ? zp(e, up(m, e)) : $p(e, Ta(m, e));
            } else {
              if (!Re[P])
                return u ? e : {};
              m = Jp(e, P, v);
            }
          }
          p || (p = new Pn());
          var Y = p.get(e);
          if (Y)
            return Y;
          p.set(e, m), Hl(e) ? e.forEach(function(Q) {
            m.add(mn(Q, n, t, Q, e, p));
          }) : Wl(e) && e.forEach(function(Q, pe) {
            m.set(pe, mn(Q, n, t, pe, e, p));
          });
          var J = I ? _ ? Fi : Bi : _ ? nn : Ue, ue = O ? o : J(e);
          return pn(ue || e, function(Q, pe) {
            ue && (pe = Q, Q = e[pe]), lr(m, pe, mn(Q, n, t, pe, e, p));
          }), m;
        }
        function cp(e) {
          var n = Ue(e);
          return function(t) {
            return Ca(t, e, n);
          };
        }
        function Ca(e, n, t) {
          var s = t.length;
          if (e == null)
            return !s;
          for (e = Ee(e); s--; ) {
            var u = t[s], p = n[u], m = e[u];
            if (m === o && !(u in e) || !p(m))
              return !1;
          }
          return !0;
        }
        function Ra(e, n, t) {
          if (typeof e != "function")
            throw new hn(h);
          return gr(function() {
            e.apply(o, t);
          }, n);
        }
        function ur(e, n, t, s) {
          var u = -1, p = Ar, m = !0, v = e.length, _ = [], I = n.length;
          if (!v)
            return _;
          t && (n = Ae(n, sn(t))), s ? (p = oi, m = !1) : n.length >= f && (p = tr, m = !1, n = new yt(n));
          e:
            for (; ++u < v; ) {
              var O = e[u], P = t == null ? O : t(O);
              if (O = s || O !== 0 ? O : 0, m && P === P) {
                for (var F = I; F--; )
                  if (n[F] === P)
                    continue e;
                _.push(O);
              } else p(n, P, s) || _.push(O);
            }
          return _;
        }
        var lt = el(Bn), Ia = el(xi, !0);
        function fp(e, n) {
          var t = !0;
          return lt(e, function(s, u, p) {
            return t = !!n(s, u, p), t;
          }), t;
        }
        function Zr(e, n, t) {
          for (var s = -1, u = e.length; ++s < u; ) {
            var p = e[s], m = n(p);
            if (m != null && (v === o ? m === m && !ln(m) : t(m, v)))
              var v = m, _ = p;
          }
          return _;
        }
        function dp(e, n, t, s) {
          var u = e.length;
          for (t = ae(t), t < 0 && (t = -t > u ? 0 : u + t), s = s === o || s > u ? u : ae(s), s < 0 && (s += u), s = t > s ? 0 : Gl(s); t < s; )
            e[t++] = n;
          return e;
        }
        function Oa(e, n) {
          var t = [];
          return lt(e, function(s, u, p) {
            n(s, u, p) && t.push(s);
          }), t;
        }
        function Ge(e, n, t, s, u) {
          var p = -1, m = e.length;
          for (t || (t = eh), u || (u = []); ++p < m; ) {
            var v = e[p];
            n > 0 && t(v) ? n > 1 ? Ge(v, n - 1, t, s, u) : it(u, v) : s || (u[u.length] = v);
          }
          return u;
        }
        var bi = nl(), Pa = nl(!0);
        function Bn(e, n) {
          return e && bi(e, n, Ue);
        }
        function xi(e, n) {
          return e && Pa(e, n, Ue);
        }
        function jr(e, n) {
          return ot(n, function(t) {
            return jn(e[t]);
          });
        }
        function xt(e, n) {
          n = ct(n, e);
          for (var t = 0, s = n.length; e != null && t < s; )
            e = e[$n(n[t++])];
          return t && t == s ? e : o;
        }
        function Ma(e, n, t) {
          var s = n(e);
          return ie(e) ? s : it(s, t(e));
        }
        function Ye(e) {
          return e == null ? e === o ? zc : At : mt && mt in Ee(e) ? Yp(e) : ah(e);
        }
        function _i(e, n) {
          return e > n;
        }
        function pp(e, n) {
          return e != null && _e.call(e, n);
        }
        function hp(e, n) {
          return e != null && n in Ee(e);
        }
        function gp(e, n, t) {
          return e >= Ke(n, t) && e < We(n, t);
        }
        function wi(e, n, t) {
          for (var s = t ? oi : Ar, u = e[0].length, p = e.length, m = p, v = w(p), _ = 1 / 0, I = []; m--; ) {
            var O = e[m];
            m && n && (O = Ae(O, sn(n))), _ = Ke(O.length, _), v[m] = !t && (n || u >= 120 && O.length >= 120) ? new yt(m && O) : o;
          }
          O = e[0];
          var P = -1, F = v[0];
          e:
            for (; ++P < u && I.length < _; ) {
              var Y = O[P], J = n ? n(Y) : Y;
              if (Y = t || Y !== 0 ? Y : 0, !(F ? tr(F, J) : s(I, J, t))) {
                for (m = p; --m; ) {
                  var ue = v[m];
                  if (!(ue ? tr(ue, J) : s(e[m], J, t)))
                    continue e;
                }
                F && F.push(J), I.push(Y);
              }
            }
          return I;
        }
        function mp(e, n, t, s) {
          return Bn(e, function(u, p, m) {
            n(s, t(u), p, m);
          }), s;
        }
        function cr(e, n, t) {
          n = ct(n, e), e = yl(e, n);
          var s = e == null ? e : e[$n(yn(n))];
          return s == null ? o : on(s, e, t);
        }
        function Aa(e) {
          return ke(e) && Ye(e) == rn;
        }
        function vp(e) {
          return ke(e) && Ye(e) == nr;
        }
        function yp(e) {
          return ke(e) && Ye(e) == Cn;
        }
        function fr(e, n, t, s, u) {
          return e === n ? !0 : e == null || n == null || !ke(e) && !ke(n) ? e !== e && n !== n : bp(e, n, t, s, fr, u);
        }
        function bp(e, n, t, s, u, p) {
          var m = ie(e), v = ie(n), _ = m ? kn : qe(e), I = v ? kn : qe(n);
          _ = _ == rn ? He : _, I = I == rn ? He : I;
          var O = _ == He, P = I == He, F = _ == I;
          if (F && dt(e)) {
            if (!dt(n))
              return !1;
            m = !0, O = !1;
          }
          if (F && !O)
            return p || (p = new Pn()), m || Kt(e) ? fl(e, n, t, s, u, p) : Kp(e, n, _, t, s, u, p);
          if (!(t & A)) {
            var Y = O && _e.call(e, "__wrapped__"), J = P && _e.call(n, "__wrapped__");
            if (Y || J) {
              var ue = Y ? e.value() : e, Q = J ? n.value() : n;
              return p || (p = new Pn()), u(ue, Q, t, s, p);
            }
          }
          return F ? (p || (p = new Pn()), qp(e, n, t, s, u, p)) : !1;
        }
        function xp(e) {
          return ke(e) && qe(e) == De;
        }
        function Ei(e, n, t, s) {
          var u = t.length, p = u, m = !s;
          if (e == null)
            return !p;
          for (e = Ee(e); u--; ) {
            var v = t[u];
            if (m && v[2] ? v[1] !== e[v[0]] : !(v[0] in e))
              return !1;
          }
          for (; ++u < p; ) {
            v = t[u];
            var _ = v[0], I = e[_], O = v[1];
            if (m && v[2]) {
              if (I === o && !(_ in e))
                return !1;
            } else {
              var P = new Pn();
              if (s)
                var F = s(I, O, _, e, n, P);
              if (!(F === o ? fr(O, I, A | k, s, P) : F))
                return !1;
            }
          }
          return !0;
        }
        function Na(e) {
          if (!Ne(e) || th(e))
            return !1;
          var n = jn(e) ? xd : cf;
          return n.test(wt(e));
        }
        function _p(e) {
          return ke(e) && Ye(e) == In;
        }
        function wp(e) {
          return ke(e) && qe(e) == Ie;
        }
        function Ep(e) {
          return ke(e) && go(e.length) && !!Oe[Ye(e)];
        }
        function La(e) {
          return typeof e == "function" ? e : e == null ? tn : typeof e == "object" ? ie(e) ? Ba(e[0], e[1]) : ka(e) : tu(e);
        }
        function Si(e) {
          if (!hr(e))
            return Cd(e);
          var n = [];
          for (var t in Ee(e))
            _e.call(e, t) && t != "constructor" && n.push(t);
          return n;
        }
        function Sp(e) {
          if (!Ne(e))
            return sh(e);
          var n = hr(e), t = [];
          for (var s in e)
            s == "constructor" && (n || !_e.call(e, s)) || t.push(s);
          return t;
        }
        function Ti(e, n) {
          return e < n;
        }
        function Da(e, n) {
          var t = -1, s = en(e) ? w(e.length) : [];
          return lt(e, function(u, p, m) {
            s[++t] = n(u, p, m);
          }), s;
        }
        function ka(e) {
          var n = zi(e);
          return n.length == 1 && n[0][2] ? ml(n[0][0], n[0][1]) : function(t) {
            return t === e || Ei(t, e, n);
          };
        }
        function Ba(e, n) {
          return Ui(e) && gl(n) ? ml($n(e), n) : function(t) {
            var s = Ji(t, e);
            return s === o && s === n ? Qi(t, e) : fr(n, s, A | k);
          };
        }
        function Jr(e, n, t, s, u) {
          e !== n && bi(n, function(p, m) {
            if (u || (u = new Pn()), Ne(p))
              Tp(e, n, m, t, Jr, s, u);
            else {
              var v = s ? s(Vi(e, m), p, m + "", e, n, u) : o;
              v === o && (v = p), vi(e, m, v);
            }
          }, nn);
        }
        function Tp(e, n, t, s, u, p, m) {
          var v = Vi(e, t), _ = Vi(n, t), I = m.get(_);
          if (I) {
            vi(e, t, I);
            return;
          }
          var O = p ? p(v, _, t + "", e, n, m) : o, P = O === o;
          if (P) {
            var F = ie(_), Y = !F && dt(_), J = !F && !Y && Kt(_);
            O = _, F || Y || J ? ie(v) ? O = v : Fe(v) ? O = Qe(v) : Y ? (P = !1, O = Xa(_, !0)) : J ? (P = !1, O = Za(_, !0)) : O = [] : mr(_) || Et(_) ? (O = v, Et(v) ? O = Kl(v) : (!Ne(v) || jn(v)) && (O = hl(_))) : P = !1;
          }
          P && (m.set(_, O), u(O, _, s, p, m), m.delete(_)), vi(e, t, O);
        }
        function Fa(e, n) {
          var t = e.length;
          if (t)
            return n += n < 0 ? t : 0, Zn(n, t) ? e[n] : o;
        }
        function $a(e, n, t) {
          n.length ? n = Ae(n, function(p) {
            return ie(p) ? function(m) {
              return xt(m, p.length === 1 ? p[0] : p);
            } : p;
          }) : n = [tn];
          var s = -1;
          n = Ae(n, sn(j()));
          var u = Da(e, function(p, m, v) {
            var _ = Ae(n, function(I) {
              return I(p);
            });
            return { criteria: _, index: ++s, value: p };
          });
          return Jf(u, function(p, m) {
            return Fp(p, m, t);
          });
        }
        function Cp(e, n) {
          return za(e, n, function(t, s) {
            return Qi(e, s);
          });
        }
        function za(e, n, t) {
          for (var s = -1, u = n.length, p = {}; ++s < u; ) {
            var m = n[s], v = xt(e, m);
            t(v, m) && dr(p, ct(m, e), v);
          }
          return p;
        }
        function Rp(e) {
          return function(n) {
            return xt(n, e);
          };
        }
        function Ci(e, n, t, s) {
          var u = s ? jf : Dt, p = -1, m = n.length, v = e;
          for (e === n && (n = Qe(n)), t && (v = Ae(e, sn(t))); ++p < m; )
            for (var _ = 0, I = n[p], O = t ? t(I) : I; (_ = u(v, O, _, s)) > -1; )
              v !== e && Ur.call(v, _, 1), Ur.call(e, _, 1);
          return e;
        }
        function Wa(e, n) {
          for (var t = e ? n.length : 0, s = t - 1; t--; ) {
            var u = n[t];
            if (t == s || u !== p) {
              var p = u;
              Zn(u) ? Ur.call(e, u, 1) : Pi(e, u);
            }
          }
          return e;
        }
        function Ri(e, n) {
          return e + Gr(_a() * (n - e + 1));
        }
        function Ip(e, n, t, s) {
          for (var u = -1, p = We(Vr((n - e) / (t || 1)), 0), m = w(p); p--; )
            m[s ? p : ++u] = e, e += t;
          return m;
        }
        function Ii(e, n) {
          var t = "";
          if (!e || n < 1 || n > Ce)
            return t;
          do
            n % 2 && (t += e), n = Gr(n / 2), n && (e += e);
          while (n);
          return t;
        }
        function ce(e, n) {
          return Gi(vl(e, n, tn), e + "");
        }
        function Op(e) {
          return Sa(qt(e));
        }
        function Pp(e, n) {
          var t = qt(e);
          return lo(t, bt(n, 0, t.length));
        }
        function dr(e, n, t, s) {
          if (!Ne(e))
            return e;
          n = ct(n, e);
          for (var u = -1, p = n.length, m = p - 1, v = e; v != null && ++u < p; ) {
            var _ = $n(n[u]), I = t;
            if (_ === "__proto__" || _ === "constructor" || _ === "prototype")
              return e;
            if (u != m) {
              var O = v[_];
              I = s ? s(O, _, v) : o, I === o && (I = Ne(O) ? O : Zn(n[u + 1]) ? [] : {});
            }
            lr(v, _, I), v = v[_];
          }
          return e;
        }
        var Ua = Kr ? function(e, n) {
          return Kr.set(e, n), e;
        } : tn, Mp = Hr ? function(e, n) {
          return Hr(e, "toString", {
            configurable: !0,
            enumerable: !1,
            value: ns(n),
            writable: !0
          });
        } : tn;
        function Ap(e) {
          return lo(qt(e));
        }
        function vn(e, n, t) {
          var s = -1, u = e.length;
          n < 0 && (n = -n > u ? 0 : u + n), t = t > u ? u : t, t < 0 && (t += u), u = n > t ? 0 : t - n >>> 0, n >>>= 0;
          for (var p = w(u); ++s < u; )
            p[s] = e[s + n];
          return p;
        }
        function Np(e, n) {
          var t;
          return lt(e, function(s, u, p) {
            return t = n(s, u, p), !t;
          }), !!t;
        }
        function Qr(e, n, t) {
          var s = 0, u = e == null ? s : e.length;
          if (typeof n == "number" && n === n && u <= Hn) {
            for (; s < u; ) {
              var p = s + u >>> 1, m = e[p];
              m !== null && !ln(m) && (t ? m <= n : m < n) ? s = p + 1 : u = p;
            }
            return u;
          }
          return Oi(e, n, tn, t);
        }
        function Oi(e, n, t, s) {
          var u = 0, p = e == null ? 0 : e.length;
          if (p === 0)
            return 0;
          n = t(n);
          for (var m = n !== n, v = n === null, _ = ln(n), I = n === o; u < p; ) {
            var O = Gr((u + p) / 2), P = t(e[O]), F = P !== o, Y = P === null, J = P === P, ue = ln(P);
            if (m)
              var Q = s || J;
            else I ? Q = J && (s || F) : v ? Q = J && F && (s || !Y) : _ ? Q = J && F && !Y && (s || !ue) : Y || ue ? Q = !1 : Q = s ? P <= n : P < n;
            Q ? u = O + 1 : p = O;
          }
          return Ke(p, je);
        }
        function Ha(e, n) {
          for (var t = -1, s = e.length, u = 0, p = []; ++t < s; ) {
            var m = e[t], v = n ? n(m) : m;
            if (!t || !Mn(v, _)) {
              var _ = v;
              p[u++] = m === 0 ? 0 : m;
            }
          }
          return p;
        }
        function Va(e) {
          return typeof e == "number" ? e : ln(e) ? we : +e;
        }
        function an(e) {
          if (typeof e == "string")
            return e;
          if (ie(e))
            return Ae(e, an) + "";
          if (ln(e))
            return wa ? wa.call(e) : "";
          var n = e + "";
          return n == "0" && 1 / e == -le ? "-0" : n;
        }
        function ut(e, n, t) {
          var s = -1, u = Ar, p = e.length, m = !0, v = [], _ = v;
          if (t)
            m = !1, u = oi;
          else if (p >= f) {
            var I = n ? null : Vp(e);
            if (I)
              return Lr(I);
            m = !1, u = tr, _ = new yt();
          } else
            _ = n ? [] : v;
          e:
            for (; ++s < p; ) {
              var O = e[s], P = n ? n(O) : O;
              if (O = t || O !== 0 ? O : 0, m && P === P) {
                for (var F = _.length; F--; )
                  if (_[F] === P)
                    continue e;
                n && _.push(P), v.push(O);
              } else u(_, P, t) || (_ !== v && _.push(P), v.push(O));
            }
          return v;
        }
        function Pi(e, n) {
          return n = ct(n, e), e = yl(e, n), e == null || delete e[$n(yn(n))];
        }
        function Ga(e, n, t, s) {
          return dr(e, n, t(xt(e, n)), s);
        }
        function eo(e, n, t, s) {
          for (var u = e.length, p = s ? u : -1; (s ? p-- : ++p < u) && n(e[p], p, e); )
            ;
          return t ? vn(e, s ? 0 : p, s ? p + 1 : u) : vn(e, s ? p + 1 : 0, s ? u : p);
        }
        function Ka(e, n) {
          var t = e;
          return t instanceof he && (t = t.value()), ii(n, function(s, u) {
            return u.func.apply(u.thisArg, it([s], u.args));
          }, t);
        }
        function Mi(e, n, t) {
          var s = e.length;
          if (s < 2)
            return s ? ut(e[0]) : [];
          for (var u = -1, p = w(s); ++u < s; )
            for (var m = e[u], v = -1; ++v < s; )
              v != u && (p[u] = ur(p[u] || m, e[v], n, t));
          return ut(Ge(p, 1), n, t);
        }
        function qa(e, n, t) {
          for (var s = -1, u = e.length, p = n.length, m = {}; ++s < u; ) {
            var v = s < p ? n[s] : o;
            t(m, e[s], v);
          }
          return m;
        }
        function Ai(e) {
          return Fe(e) ? e : [];
        }
        function Ni(e) {
          return typeof e == "function" ? e : tn;
        }
        function ct(e, n) {
          return ie(e) ? e : Ui(e, n) ? [e] : wl(xe(e));
        }
        var Lp = ce;
        function ft(e, n, t) {
          var s = e.length;
          return t = t === o ? s : t, !n && t >= s ? e : vn(e, n, t);
        }
        var Ya = _d || function(e) {
          return Ve.clearTimeout(e);
        };
        function Xa(e, n) {
          if (n)
            return e.slice();
          var t = e.length, s = ma ? ma(t) : new e.constructor(t);
          return e.copy(s), s;
        }
        function Li(e) {
          var n = new e.constructor(e.byteLength);
          return new zr(n).set(new zr(e)), n;
        }
        function Dp(e, n) {
          var t = n ? Li(e.buffer) : e.buffer;
          return new e.constructor(t, e.byteOffset, e.byteLength);
        }
        function kp(e) {
          var n = new e.constructor(e.source, As.exec(e));
          return n.lastIndex = e.lastIndex, n;
        }
        function Bp(e) {
          return ar ? Ee(ar.call(e)) : {};
        }
        function Za(e, n) {
          var t = n ? Li(e.buffer) : e.buffer;
          return new e.constructor(t, e.byteOffset, e.length);
        }
        function ja(e, n) {
          if (e !== n) {
            var t = e !== o, s = e === null, u = e === e, p = ln(e), m = n !== o, v = n === null, _ = n === n, I = ln(n);
            if (!v && !I && !p && e > n || p && m && _ && !v && !I || s && m && _ || !t && _ || !u)
              return 1;
            if (!s && !p && !I && e < n || I && t && u && !s && !p || v && t && u || !m && u || !_)
              return -1;
          }
          return 0;
        }
        function Fp(e, n, t) {
          for (var s = -1, u = e.criteria, p = n.criteria, m = u.length, v = t.length; ++s < m; ) {
            var _ = ja(u[s], p[s]);
            if (_) {
              if (s >= v)
                return _;
              var I = t[s];
              return _ * (I == "desc" ? -1 : 1);
            }
          }
          return e.index - n.index;
        }
        function Ja(e, n, t, s) {
          for (var u = -1, p = e.length, m = t.length, v = -1, _ = n.length, I = We(p - m, 0), O = w(_ + I), P = !s; ++v < _; )
            O[v] = n[v];
          for (; ++u < m; )
            (P || u < p) && (O[t[u]] = e[u]);
          for (; I--; )
            O[v++] = e[u++];
          return O;
        }
        function Qa(e, n, t, s) {
          for (var u = -1, p = e.length, m = -1, v = t.length, _ = -1, I = n.length, O = We(p - v, 0), P = w(O + I), F = !s; ++u < O; )
            P[u] = e[u];
          for (var Y = u; ++_ < I; )
            P[Y + _] = n[_];
          for (; ++m < v; )
            (F || u < p) && (P[Y + t[m]] = e[u++]);
          return P;
        }
        function Qe(e, n) {
          var t = -1, s = e.length;
          for (n || (n = w(s)); ++t < s; )
            n[t] = e[t];
          return n;
        }
        function Fn(e, n, t, s) {
          var u = !t;
          t || (t = {});
          for (var p = -1, m = n.length; ++p < m; ) {
            var v = n[p], _ = s ? s(t[v], e[v], v, t, e) : o;
            _ === o && (_ = e[v]), u ? qn(t, v, _) : lr(t, v, _);
          }
          return t;
        }
        function $p(e, n) {
          return Fn(e, Wi(e), n);
        }
        function zp(e, n) {
          return Fn(e, dl(e), n);
        }
        function no(e, n) {
          return function(t, s) {
            var u = ie(t) ? Gf : lp, p = n ? n() : {};
            return u(t, e, j(s, 2), p);
          };
        }
        function Ht(e) {
          return ce(function(n, t) {
            var s = -1, u = t.length, p = u > 1 ? t[u - 1] : o, m = u > 2 ? t[2] : o;
            for (p = e.length > 3 && typeof p == "function" ? (u--, p) : o, m && Xe(t[0], t[1], m) && (p = u < 3 ? o : p, u = 1), n = Ee(n); ++s < u; ) {
              var v = t[s];
              v && e(n, v, s, p);
            }
            return n;
          });
        }
        function el(e, n) {
          return function(t, s) {
            if (t == null)
              return t;
            if (!en(t))
              return e(t, s);
            for (var u = t.length, p = n ? u : -1, m = Ee(t); (n ? p-- : ++p < u) && s(m[p], p, m) !== !1; )
              ;
            return t;
          };
        }
        function nl(e) {
          return function(n, t, s) {
            for (var u = -1, p = Ee(n), m = s(n), v = m.length; v--; ) {
              var _ = m[e ? v : ++u];
              if (t(p[_], _, p) === !1)
                break;
            }
            return n;
          };
        }
        function Wp(e, n, t) {
          var s = n & z, u = pr(e);
          function p() {
            var m = this && this !== Ve && this instanceof p ? u : e;
            return m.apply(s ? t : this, arguments);
          }
          return p;
        }
        function tl(e) {
          return function(n) {
            n = xe(n);
            var t = kt(n) ? On(n) : o, s = t ? t[0] : n.charAt(0), u = t ? ft(t, 1).join("") : n.slice(1);
            return s[e]() + u;
          };
        }
        function Vt(e) {
          return function(n) {
            return ii(eu(Ql(n).replace(Mf, "")), e, "");
          };
        }
        function pr(e) {
          return function() {
            var n = arguments;
            switch (n.length) {
              case 0:
                return new e();
              case 1:
                return new e(n[0]);
              case 2:
                return new e(n[0], n[1]);
              case 3:
                return new e(n[0], n[1], n[2]);
              case 4:
                return new e(n[0], n[1], n[2], n[3]);
              case 5:
                return new e(n[0], n[1], n[2], n[3], n[4]);
              case 6:
                return new e(n[0], n[1], n[2], n[3], n[4], n[5]);
              case 7:
                return new e(n[0], n[1], n[2], n[3], n[4], n[5], n[6]);
            }
            var t = Ut(e.prototype), s = e.apply(t, n);
            return Ne(s) ? s : t;
          };
        }
        function Up(e, n, t) {
          var s = pr(e);
          function u() {
            for (var p = arguments.length, m = w(p), v = p, _ = Gt(u); v--; )
              m[v] = arguments[v];
            var I = p < 3 && m[0] !== _ && m[p - 1] !== _ ? [] : st(m, _);
            if (p -= I.length, p < t)
              return al(
                e,
                n,
                to,
                u.placeholder,
                o,
                m,
                I,
                o,
                o,
                t - p
              );
            var O = this && this !== Ve && this instanceof u ? s : e;
            return on(O, this, m);
          }
          return u;
        }
        function rl(e) {
          return function(n, t, s) {
            var u = Ee(n);
            if (!en(n)) {
              var p = j(t, 3);
              n = Ue(n), t = function(v) {
                return p(u[v], v, u);
              };
            }
            var m = e(n, t, s);
            return m > -1 ? u[p ? n[m] : m] : o;
          };
        }
        function ol(e) {
          return Xn(function(n) {
            var t = n.length, s = t, u = gn.prototype.thru;
            for (e && n.reverse(); s--; ) {
              var p = n[s];
              if (typeof p != "function")
                throw new hn(h);
              if (u && !m && so(p) == "wrapper")
                var m = new gn([], !0);
            }
            for (s = m ? s : t; ++s < t; ) {
              p = n[s];
              var v = so(p), _ = v == "wrapper" ? $i(p) : o;
              _ && Hi(_[0]) && _[1] == (W | L | U | G) && !_[4].length && _[9] == 1 ? m = m[so(_[0])].apply(m, _[3]) : m = p.length == 1 && Hi(p) ? m[v]() : m.thru(p);
            }
            return function() {
              var I = arguments, O = I[0];
              if (m && I.length == 1 && ie(O))
                return m.plant(O).value();
              for (var P = 0, F = t ? n[P].apply(this, I) : O; ++P < t; )
                F = n[P].call(this, F);
              return F;
            };
          });
        }
        function to(e, n, t, s, u, p, m, v, _, I) {
          var O = n & W, P = n & z, F = n & B, Y = n & (L | D), J = n & Z, ue = F ? o : pr(e);
          function Q() {
            for (var pe = arguments.length, me = w(pe), un = pe; un--; )
              me[un] = arguments[un];
            if (Y)
              var Ze = Gt(Q), cn = ed(me, Ze);
            if (s && (me = Ja(me, s, u, Y)), p && (me = Qa(me, p, m, Y)), pe -= cn, Y && pe < I) {
              var $e = st(me, Ze);
              return al(
                e,
                n,
                to,
                Q.placeholder,
                t,
                me,
                $e,
                v,
                _,
                I - pe
              );
            }
            var An = P ? t : this, Qn = F ? An[e] : e;
            return pe = me.length, v ? me = lh(me, v) : J && pe > 1 && me.reverse(), O && _ < pe && (me.length = _), this && this !== Ve && this instanceof Q && (Qn = ue || pr(Qn)), Qn.apply(An, me);
          }
          return Q;
        }
        function il(e, n) {
          return function(t, s) {
            return mp(t, e, n(s), {});
          };
        }
        function ro(e, n) {
          return function(t, s) {
            var u;
            if (t === o && s === o)
              return n;
            if (t !== o && (u = t), s !== o) {
              if (u === o)
                return s;
              typeof t == "string" || typeof s == "string" ? (t = an(t), s = an(s)) : (t = Va(t), s = Va(s)), u = e(t, s);
            }
            return u;
          };
        }
        function Di(e) {
          return Xn(function(n) {
            return n = Ae(n, sn(j())), ce(function(t) {
              var s = this;
              return e(n, function(u) {
                return on(u, s, t);
              });
            });
          });
        }
        function oo(e, n) {
          n = n === o ? " " : an(n);
          var t = n.length;
          if (t < 2)
            return t ? Ii(n, e) : n;
          var s = Ii(n, Vr(e / Bt(n)));
          return kt(n) ? ft(On(s), 0, e).join("") : s.slice(0, e);
        }
        function Hp(e, n, t, s) {
          var u = n & z, p = pr(e);
          function m() {
            for (var v = -1, _ = arguments.length, I = -1, O = s.length, P = w(O + _), F = this && this !== Ve && this instanceof m ? p : e; ++I < O; )
              P[I] = s[I];
            for (; _--; )
              P[I++] = arguments[++v];
            return on(F, u ? t : this, P);
          }
          return m;
        }
        function sl(e) {
          return function(n, t, s) {
            return s && typeof s != "number" && Xe(n, t, s) && (t = s = o), n = Jn(n), t === o ? (t = n, n = 0) : t = Jn(t), s = s === o ? n < t ? 1 : -1 : Jn(s), Ip(n, t, s, e);
          };
        }
        function io(e) {
          return function(n, t) {
            return typeof n == "string" && typeof t == "string" || (n = bn(n), t = bn(t)), e(n, t);
          };
        }
        function al(e, n, t, s, u, p, m, v, _, I) {
          var O = n & L, P = O ? m : o, F = O ? o : m, Y = O ? p : o, J = O ? o : p;
          n |= O ? U : q, n &= ~(O ? q : U), n & H || (n &= -4);
          var ue = [
            e,
            n,
            u,
            Y,
            P,
            J,
            F,
            v,
            _,
            I
          ], Q = t.apply(o, ue);
          return Hi(e) && bl(Q, ue), Q.placeholder = s, xl(Q, e, n);
        }
        function ki(e) {
          var n = ze[e];
          return function(t, s) {
            if (t = bn(t), s = s == null ? 0 : Ke(ae(s), 292), s && xa(t)) {
              var u = (xe(t) + "e").split("e"), p = n(u[0] + "e" + (+u[1] + s));
              return u = (xe(p) + "e").split("e"), +(u[0] + "e" + (+u[1] - s));
            }
            return n(t);
          };
        }
        var Vp = zt && 1 / Lr(new zt([, -0]))[1] == le ? function(e) {
          return new zt(e);
        } : os;
        function ll(e) {
          return function(n) {
            var t = qe(n);
            return t == De ? di(n) : t == Ie ? ad(n) : Qf(n, e(n));
          };
        }
        function Yn(e, n, t, s, u, p, m, v) {
          var _ = n & B;
          if (!_ && typeof e != "function")
            throw new hn(h);
          var I = s ? s.length : 0;
          if (I || (n &= -97, s = u = o), m = m === o ? m : We(ae(m), 0), v = v === o ? v : ae(v), I -= u ? u.length : 0, n & q) {
            var O = s, P = u;
            s = u = o;
          }
          var F = _ ? o : $i(e), Y = [
            e,
            n,
            t,
            s,
            u,
            O,
            P,
            p,
            m,
            v
          ];
          if (F && ih(Y, F), e = Y[0], n = Y[1], t = Y[2], s = Y[3], u = Y[4], v = Y[9] = Y[9] === o ? _ ? 0 : e.length : We(Y[9] - I, 0), !v && n & (L | D) && (n &= -25), !n || n == z)
            var J = Wp(e, n, t);
          else n == L || n == D ? J = Up(e, n, v) : (n == U || n == (z | U)) && !u.length ? J = Hp(e, n, t, s) : J = to.apply(o, Y);
          var ue = F ? Ua : bl;
          return xl(ue(J, Y), e, n);
        }
        function ul(e, n, t, s) {
          return e === o || Mn(e, $t[t]) && !_e.call(s, t) ? n : e;
        }
        function cl(e, n, t, s, u, p) {
          return Ne(e) && Ne(n) && (p.set(n, e), Jr(e, n, o, cl, p), p.delete(n)), e;
        }
        function Gp(e) {
          return mr(e) ? o : e;
        }
        function fl(e, n, t, s, u, p) {
          var m = t & A, v = e.length, _ = n.length;
          if (v != _ && !(m && _ > v))
            return !1;
          var I = p.get(e), O = p.get(n);
          if (I && O)
            return I == n && O == e;
          var P = -1, F = !0, Y = t & k ? new yt() : o;
          for (p.set(e, n), p.set(n, e); ++P < v; ) {
            var J = e[P], ue = n[P];
            if (s)
              var Q = m ? s(ue, J, P, n, e, p) : s(J, ue, P, e, n, p);
            if (Q !== o) {
              if (Q)
                continue;
              F = !1;
              break;
            }
            if (Y) {
              if (!si(n, function(pe, me) {
                if (!tr(Y, me) && (J === pe || u(J, pe, t, s, p)))
                  return Y.push(me);
              })) {
                F = !1;
                break;
              }
            } else if (!(J === ue || u(J, ue, t, s, p))) {
              F = !1;
              break;
            }
          }
          return p.delete(e), p.delete(n), F;
        }
        function Kp(e, n, t, s, u, p, m) {
          switch (t) {
            case Nt:
              if (e.byteLength != n.byteLength || e.byteOffset != n.byteOffset)
                return !1;
              e = e.buffer, n = n.buffer;
            case nr:
              return !(e.byteLength != n.byteLength || !p(new zr(e), new zr(n)));
            case Tn:
            case Cn:
            case Je:
              return Mn(+e, +n);
            case ye:
              return e.name == n.name && e.message == n.message;
            case In:
            case ne:
              return e == n + "";
            case De:
              var v = di;
            case Ie:
              var _ = s & A;
              if (v || (v = Lr), e.size != n.size && !_)
                return !1;
              var I = m.get(e);
              if (I)
                return I == n;
              s |= k, m.set(e, n);
              var O = fl(v(e), v(n), s, u, p, m);
              return m.delete(e), O;
            case Ir:
              if (ar)
                return ar.call(e) == ar.call(n);
          }
          return !1;
        }
        function qp(e, n, t, s, u, p) {
          var m = t & A, v = Bi(e), _ = v.length, I = Bi(n), O = I.length;
          if (_ != O && !m)
            return !1;
          for (var P = _; P--; ) {
            var F = v[P];
            if (!(m ? F in n : _e.call(n, F)))
              return !1;
          }
          var Y = p.get(e), J = p.get(n);
          if (Y && J)
            return Y == n && J == e;
          var ue = !0;
          p.set(e, n), p.set(n, e);
          for (var Q = m; ++P < _; ) {
            F = v[P];
            var pe = e[F], me = n[F];
            if (s)
              var un = m ? s(me, pe, F, n, e, p) : s(pe, me, F, e, n, p);
            if (!(un === o ? pe === me || u(pe, me, t, s, p) : un)) {
              ue = !1;
              break;
            }
            Q || (Q = F == "constructor");
          }
          if (ue && !Q) {
            var Ze = e.constructor, cn = n.constructor;
            Ze != cn && "constructor" in e && "constructor" in n && !(typeof Ze == "function" && Ze instanceof Ze && typeof cn == "function" && cn instanceof cn) && (ue = !1);
          }
          return p.delete(e), p.delete(n), ue;
        }
        function Xn(e) {
          return Gi(vl(e, o, Cl), e + "");
        }
        function Bi(e) {
          return Ma(e, Ue, Wi);
        }
        function Fi(e) {
          return Ma(e, nn, dl);
        }
        var $i = Kr ? function(e) {
          return Kr.get(e);
        } : os;
        function so(e) {
          for (var n = e.name + "", t = Wt[n], s = _e.call(Wt, n) ? t.length : 0; s--; ) {
            var u = t[s], p = u.func;
            if (p == null || p == e)
              return u.name;
          }
          return n;
        }
        function Gt(e) {
          var n = _e.call(d, "placeholder") ? d : e;
          return n.placeholder;
        }
        function j() {
          var e = d.iteratee || ts;
          return e = e === ts ? La : e, arguments.length ? e(arguments[0], arguments[1]) : e;
        }
        function ao(e, n) {
          var t = e.__data__;
          return nh(n) ? t[typeof n == "string" ? "string" : "hash"] : t.map;
        }
        function zi(e) {
          for (var n = Ue(e), t = n.length; t--; ) {
            var s = n[t], u = e[s];
            n[t] = [s, u, gl(u)];
          }
          return n;
        }
        function _t(e, n) {
          var t = od(e, n);
          return Na(t) ? t : o;
        }
        function Yp(e) {
          var n = _e.call(e, mt), t = e[mt];
          try {
            e[mt] = o;
            var s = !0;
          } catch {
          }
          var u = Fr.call(e);
          return s && (n ? e[mt] = t : delete e[mt]), u;
        }
        var Wi = hi ? function(e) {
          return e == null ? [] : (e = Ee(e), ot(hi(e), function(n) {
            return ya.call(e, n);
          }));
        } : is, dl = hi ? function(e) {
          for (var n = []; e; )
            it(n, Wi(e)), e = Wr(e);
          return n;
        } : is, qe = Ye;
        (gi && qe(new gi(new ArrayBuffer(1))) != Nt || or && qe(new or()) != De || mi && qe(mi.resolve()) != Rn || zt && qe(new zt()) != Ie || ir && qe(new ir()) != er) && (qe = function(e) {
          var n = Ye(e), t = n == He ? e.constructor : o, s = t ? wt(t) : "";
          if (s)
            switch (s) {
              case Pd:
                return Nt;
              case Md:
                return De;
              case Ad:
                return Rn;
              case Nd:
                return Ie;
              case Ld:
                return er;
            }
          return n;
        });
        function Xp(e, n, t) {
          for (var s = -1, u = t.length; ++s < u; ) {
            var p = t[s], m = p.size;
            switch (p.type) {
              case "drop":
                e += m;
                break;
              case "dropRight":
                n -= m;
                break;
              case "take":
                n = Ke(n, e + m);
                break;
              case "takeRight":
                e = We(e, n - m);
                break;
            }
          }
          return { start: e, end: n };
        }
        function Zp(e) {
          var n = e.match(nf);
          return n ? n[1].split(tf) : [];
        }
        function pl(e, n, t) {
          n = ct(n, e);
          for (var s = -1, u = n.length, p = !1; ++s < u; ) {
            var m = $n(n[s]);
            if (!(p = e != null && t(e, m)))
              break;
            e = e[m];
          }
          return p || ++s != u ? p : (u = e == null ? 0 : e.length, !!u && go(u) && Zn(m, u) && (ie(e) || Et(e)));
        }
        function jp(e) {
          var n = e.length, t = new e.constructor(n);
          return n && typeof e[0] == "string" && _e.call(e, "index") && (t.index = e.index, t.input = e.input), t;
        }
        function hl(e) {
          return typeof e.constructor == "function" && !hr(e) ? Ut(Wr(e)) : {};
        }
        function Jp(e, n, t) {
          var s = e.constructor;
          switch (n) {
            case nr:
              return Li(e);
            case Tn:
            case Cn:
              return new s(+e);
            case Nt:
              return Dp(e, t);
            case zo:
            case Wo:
            case Uo:
            case Ho:
            case Vo:
            case Go:
            case Ko:
            case qo:
            case Yo:
              return Za(e, t);
            case De:
              return new s();
            case Je:
            case ne:
              return new s(e);
            case In:
              return kp(e);
            case Ie:
              return new s();
            case Ir:
              return Bp(e);
          }
        }
        function Qp(e, n) {
          var t = n.length;
          if (!t)
            return e;
          var s = t - 1;
          return n[s] = (t > 1 ? "& " : "") + n[s], n = n.join(t > 2 ? ", " : " "), e.replace(ef, `{
/* [wrapped with ` + n + `] */
`);
        }
        function eh(e) {
          return ie(e) || Et(e) || !!(ba && e && e[ba]);
        }
        function Zn(e, n) {
          var t = typeof e;
          return n = n ?? Ce, !!n && (t == "number" || t != "symbol" && df.test(e)) && e > -1 && e % 1 == 0 && e < n;
        }
        function Xe(e, n, t) {
          if (!Ne(t))
            return !1;
          var s = typeof n;
          return (s == "number" ? en(t) && Zn(n, t.length) : s == "string" && n in t) ? Mn(t[n], e) : !1;
        }
        function Ui(e, n) {
          if (ie(e))
            return !1;
          var t = typeof e;
          return t == "number" || t == "symbol" || t == "boolean" || e == null || ln(e) ? !0 : Zc.test(e) || !Xc.test(e) || n != null && e in Ee(n);
        }
        function nh(e) {
          var n = typeof e;
          return n == "string" || n == "number" || n == "symbol" || n == "boolean" ? e !== "__proto__" : e === null;
        }
        function Hi(e) {
          var n = so(e), t = d[n];
          if (typeof t != "function" || !(n in he.prototype))
            return !1;
          if (e === t)
            return !0;
          var s = $i(t);
          return !!s && e === s[0];
        }
        function th(e) {
          return !!ga && ga in e;
        }
        var rh = kr ? jn : ss;
        function hr(e) {
          var n = e && e.constructor, t = typeof n == "function" && n.prototype || $t;
          return e === t;
        }
        function gl(e) {
          return e === e && !Ne(e);
        }
        function ml(e, n) {
          return function(t) {
            return t == null ? !1 : t[e] === n && (n !== o || e in Ee(t));
          };
        }
        function oh(e) {
          var n = po(e, function(s) {
            return t.size === b && t.clear(), s;
          }), t = n.cache;
          return n;
        }
        function ih(e, n) {
          var t = e[1], s = n[1], u = t | s, p = u < (z | B | W), m = s == W && t == L || s == W && t == G && e[7].length <= n[8] || s == (W | G) && n[7].length <= n[8] && t == L;
          if (!(p || m))
            return e;
          s & z && (e[2] = n[2], u |= t & z ? 0 : H);
          var v = n[3];
          if (v) {
            var _ = e[3];
            e[3] = _ ? Ja(_, v, n[4]) : v, e[4] = _ ? st(e[3], E) : n[4];
          }
          return v = n[5], v && (_ = e[5], e[5] = _ ? Qa(_, v, n[6]) : v, e[6] = _ ? st(e[5], E) : n[6]), v = n[7], v && (e[7] = v), s & W && (e[8] = e[8] == null ? n[8] : Ke(e[8], n[8])), e[9] == null && (e[9] = n[9]), e[0] = n[0], e[1] = u, e;
        }
        function sh(e) {
          var n = [];
          if (e != null)
            for (var t in Ee(e))
              n.push(t);
          return n;
        }
        function ah(e) {
          return Fr.call(e);
        }
        function vl(e, n, t) {
          return n = We(n === o ? e.length - 1 : n, 0), function() {
            for (var s = arguments, u = -1, p = We(s.length - n, 0), m = w(p); ++u < p; )
              m[u] = s[n + u];
            u = -1;
            for (var v = w(n + 1); ++u < n; )
              v[u] = s[u];
            return v[n] = t(m), on(e, this, v);
          };
        }
        function yl(e, n) {
          return n.length < 2 ? e : xt(e, vn(n, 0, -1));
        }
        function lh(e, n) {
          for (var t = e.length, s = Ke(n.length, t), u = Qe(e); s--; ) {
            var p = n[s];
            e[s] = Zn(p, t) ? u[p] : o;
          }
          return e;
        }
        function Vi(e, n) {
          if (!(n === "constructor" && typeof e[n] == "function") && n != "__proto__")
            return e[n];
        }
        var bl = _l(Ua), gr = Ed || function(e, n) {
          return Ve.setTimeout(e, n);
        }, Gi = _l(Mp);
        function xl(e, n, t) {
          var s = n + "";
          return Gi(e, Qp(s, uh(Zp(s), t)));
        }
        function _l(e) {
          var n = 0, t = 0;
          return function() {
            var s = Rd(), u = re - (s - t);
            if (t = s, u > 0) {
              if (++n >= se)
                return arguments[0];
            } else
              n = 0;
            return e.apply(o, arguments);
          };
        }
        function lo(e, n) {
          var t = -1, s = e.length, u = s - 1;
          for (n = n === o ? s : n; ++t < n; ) {
            var p = Ri(t, u), m = e[p];
            e[p] = e[t], e[t] = m;
          }
          return e.length = n, e;
        }
        var wl = oh(function(e) {
          var n = [];
          return e.charCodeAt(0) === 46 && n.push(""), e.replace(jc, function(t, s, u, p) {
            n.push(u ? p.replace(sf, "$1") : s || t);
          }), n;
        });
        function $n(e) {
          if (typeof e == "string" || ln(e))
            return e;
          var n = e + "";
          return n == "0" && 1 / e == -le ? "-0" : n;
        }
        function wt(e) {
          if (e != null) {
            try {
              return Br.call(e);
            } catch {
            }
            try {
              return e + "";
            } catch {
            }
          }
          return "";
        }
        function uh(e, n) {
          return pn(Sn, function(t) {
            var s = "_." + t[0];
            n & t[1] && !Ar(e, s) && e.push(s);
          }), e.sort();
        }
        function El(e) {
          if (e instanceof he)
            return e.clone();
          var n = new gn(e.__wrapped__, e.__chain__);
          return n.__actions__ = Qe(e.__actions__), n.__index__ = e.__index__, n.__values__ = e.__values__, n;
        }
        function ch(e, n, t) {
          (t ? Xe(e, n, t) : n === o) ? n = 1 : n = We(ae(n), 0);
          var s = e == null ? 0 : e.length;
          if (!s || n < 1)
            return [];
          for (var u = 0, p = 0, m = w(Vr(s / n)); u < s; )
            m[p++] = vn(e, u, u += n);
          return m;
        }
        function fh(e) {
          for (var n = -1, t = e == null ? 0 : e.length, s = 0, u = []; ++n < t; ) {
            var p = e[n];
            p && (u[s++] = p);
          }
          return u;
        }
        function dh() {
          var e = arguments.length;
          if (!e)
            return [];
          for (var n = w(e - 1), t = arguments[0], s = e; s--; )
            n[s - 1] = arguments[s];
          return it(ie(t) ? Qe(t) : [t], Ge(n, 1));
        }
        var ph = ce(function(e, n) {
          return Fe(e) ? ur(e, Ge(n, 1, Fe, !0)) : [];
        }), hh = ce(function(e, n) {
          var t = yn(n);
          return Fe(t) && (t = o), Fe(e) ? ur(e, Ge(n, 1, Fe, !0), j(t, 2)) : [];
        }), gh = ce(function(e, n) {
          var t = yn(n);
          return Fe(t) && (t = o), Fe(e) ? ur(e, Ge(n, 1, Fe, !0), o, t) : [];
        });
        function mh(e, n, t) {
          var s = e == null ? 0 : e.length;
          return s ? (n = t || n === o ? 1 : ae(n), vn(e, n < 0 ? 0 : n, s)) : [];
        }
        function vh(e, n, t) {
          var s = e == null ? 0 : e.length;
          return s ? (n = t || n === o ? 1 : ae(n), n = s - n, vn(e, 0, n < 0 ? 0 : n)) : [];
        }
        function yh(e, n) {
          return e && e.length ? eo(e, j(n, 3), !0, !0) : [];
        }
        function bh(e, n) {
          return e && e.length ? eo(e, j(n, 3), !0) : [];
        }
        function xh(e, n, t, s) {
          var u = e == null ? 0 : e.length;
          return u ? (t && typeof t != "number" && Xe(e, n, t) && (t = 0, s = u), dp(e, n, t, s)) : [];
        }
        function Sl(e, n, t) {
          var s = e == null ? 0 : e.length;
          if (!s)
            return -1;
          var u = t == null ? 0 : ae(t);
          return u < 0 && (u = We(s + u, 0)), Nr(e, j(n, 3), u);
        }
        function Tl(e, n, t) {
          var s = e == null ? 0 : e.length;
          if (!s)
            return -1;
          var u = s - 1;
          return t !== o && (u = ae(t), u = t < 0 ? We(s + u, 0) : Ke(u, s - 1)), Nr(e, j(n, 3), u, !0);
        }
        function Cl(e) {
          var n = e == null ? 0 : e.length;
          return n ? Ge(e, 1) : [];
        }
        function _h(e) {
          var n = e == null ? 0 : e.length;
          return n ? Ge(e, le) : [];
        }
        function wh(e, n) {
          var t = e == null ? 0 : e.length;
          return t ? (n = n === o ? 1 : ae(n), Ge(e, n)) : [];
        }
        function Eh(e) {
          for (var n = -1, t = e == null ? 0 : e.length, s = {}; ++n < t; ) {
            var u = e[n];
            s[u[0]] = u[1];
          }
          return s;
        }
        function Rl(e) {
          return e && e.length ? e[0] : o;
        }
        function Sh(e, n, t) {
          var s = e == null ? 0 : e.length;
          if (!s)
            return -1;
          var u = t == null ? 0 : ae(t);
          return u < 0 && (u = We(s + u, 0)), Dt(e, n, u);
        }
        function Th(e) {
          var n = e == null ? 0 : e.length;
          return n ? vn(e, 0, -1) : [];
        }
        var Ch = ce(function(e) {
          var n = Ae(e, Ai);
          return n.length && n[0] === e[0] ? wi(n) : [];
        }), Rh = ce(function(e) {
          var n = yn(e), t = Ae(e, Ai);
          return n === yn(t) ? n = o : t.pop(), t.length && t[0] === e[0] ? wi(t, j(n, 2)) : [];
        }), Ih = ce(function(e) {
          var n = yn(e), t = Ae(e, Ai);
          return n = typeof n == "function" ? n : o, n && t.pop(), t.length && t[0] === e[0] ? wi(t, o, n) : [];
        });
        function Oh(e, n) {
          return e == null ? "" : Td.call(e, n);
        }
        function yn(e) {
          var n = e == null ? 0 : e.length;
          return n ? e[n - 1] : o;
        }
        function Ph(e, n, t) {
          var s = e == null ? 0 : e.length;
          if (!s)
            return -1;
          var u = s;
          return t !== o && (u = ae(t), u = u < 0 ? We(s + u, 0) : Ke(u, s - 1)), n === n ? ud(e, n, u) : Nr(e, aa, u, !0);
        }
        function Mh(e, n) {
          return e && e.length ? Fa(e, ae(n)) : o;
        }
        var Ah = ce(Il);
        function Il(e, n) {
          return e && e.length && n && n.length ? Ci(e, n) : e;
        }
        function Nh(e, n, t) {
          return e && e.length && n && n.length ? Ci(e, n, j(t, 2)) : e;
        }
        function Lh(e, n, t) {
          return e && e.length && n && n.length ? Ci(e, n, o, t) : e;
        }
        var Dh = Xn(function(e, n) {
          var t = e == null ? 0 : e.length, s = yi(e, n);
          return Wa(e, Ae(n, function(u) {
            return Zn(u, t) ? +u : u;
          }).sort(ja)), s;
        });
        function kh(e, n) {
          var t = [];
          if (!(e && e.length))
            return t;
          var s = -1, u = [], p = e.length;
          for (n = j(n, 3); ++s < p; ) {
            var m = e[s];
            n(m, s, e) && (t.push(m), u.push(s));
          }
          return Wa(e, u), t;
        }
        function Ki(e) {
          return e == null ? e : Od.call(e);
        }
        function Bh(e, n, t) {
          var s = e == null ? 0 : e.length;
          return s ? (t && typeof t != "number" && Xe(e, n, t) ? (n = 0, t = s) : (n = n == null ? 0 : ae(n), t = t === o ? s : ae(t)), vn(e, n, t)) : [];
        }
        function Fh(e, n) {
          return Qr(e, n);
        }
        function $h(e, n, t) {
          return Oi(e, n, j(t, 2));
        }
        function zh(e, n) {
          var t = e == null ? 0 : e.length;
          if (t) {
            var s = Qr(e, n);
            if (s < t && Mn(e[s], n))
              return s;
          }
          return -1;
        }
        function Wh(e, n) {
          return Qr(e, n, !0);
        }
        function Uh(e, n, t) {
          return Oi(e, n, j(t, 2), !0);
        }
        function Hh(e, n) {
          var t = e == null ? 0 : e.length;
          if (t) {
            var s = Qr(e, n, !0) - 1;
            if (Mn(e[s], n))
              return s;
          }
          return -1;
        }
        function Vh(e) {
          return e && e.length ? Ha(e) : [];
        }
        function Gh(e, n) {
          return e && e.length ? Ha(e, j(n, 2)) : [];
        }
        function Kh(e) {
          var n = e == null ? 0 : e.length;
          return n ? vn(e, 1, n) : [];
        }
        function qh(e, n, t) {
          return e && e.length ? (n = t || n === o ? 1 : ae(n), vn(e, 0, n < 0 ? 0 : n)) : [];
        }
        function Yh(e, n, t) {
          var s = e == null ? 0 : e.length;
          return s ? (n = t || n === o ? 1 : ae(n), n = s - n, vn(e, n < 0 ? 0 : n, s)) : [];
        }
        function Xh(e, n) {
          return e && e.length ? eo(e, j(n, 3), !1, !0) : [];
        }
        function Zh(e, n) {
          return e && e.length ? eo(e, j(n, 3)) : [];
        }
        var jh = ce(function(e) {
          return ut(Ge(e, 1, Fe, !0));
        }), Jh = ce(function(e) {
          var n = yn(e);
          return Fe(n) && (n = o), ut(Ge(e, 1, Fe, !0), j(n, 2));
        }), Qh = ce(function(e) {
          var n = yn(e);
          return n = typeof n == "function" ? n : o, ut(Ge(e, 1, Fe, !0), o, n);
        });
        function eg(e) {
          return e && e.length ? ut(e) : [];
        }
        function ng(e, n) {
          return e && e.length ? ut(e, j(n, 2)) : [];
        }
        function tg(e, n) {
          return n = typeof n == "function" ? n : o, e && e.length ? ut(e, o, n) : [];
        }
        function qi(e) {
          if (!(e && e.length))
            return [];
          var n = 0;
          return e = ot(e, function(t) {
            if (Fe(t))
              return n = We(t.length, n), !0;
          }), ci(n, function(t) {
            return Ae(e, ai(t));
          });
        }
        function Ol(e, n) {
          if (!(e && e.length))
            return [];
          var t = qi(e);
          return n == null ? t : Ae(t, function(s) {
            return on(n, o, s);
          });
        }
        var rg = ce(function(e, n) {
          return Fe(e) ? ur(e, n) : [];
        }), og = ce(function(e) {
          return Mi(ot(e, Fe));
        }), ig = ce(function(e) {
          var n = yn(e);
          return Fe(n) && (n = o), Mi(ot(e, Fe), j(n, 2));
        }), sg = ce(function(e) {
          var n = yn(e);
          return n = typeof n == "function" ? n : o, Mi(ot(e, Fe), o, n);
        }), ag = ce(qi);
        function lg(e, n) {
          return qa(e || [], n || [], lr);
        }
        function ug(e, n) {
          return qa(e || [], n || [], dr);
        }
        var cg = ce(function(e) {
          var n = e.length, t = n > 1 ? e[n - 1] : o;
          return t = typeof t == "function" ? (e.pop(), t) : o, Ol(e, t);
        });
        function Pl(e) {
          var n = d(e);
          return n.__chain__ = !0, n;
        }
        function fg(e, n) {
          return n(e), e;
        }
        function uo(e, n) {
          return n(e);
        }
        var dg = Xn(function(e) {
          var n = e.length, t = n ? e[0] : 0, s = this.__wrapped__, u = function(p) {
            return yi(p, e);
          };
          return n > 1 || this.__actions__.length || !(s instanceof he) || !Zn(t) ? this.thru(u) : (s = s.slice(t, +t + (n ? 1 : 0)), s.__actions__.push({
            func: uo,
            args: [u],
            thisArg: o
          }), new gn(s, this.__chain__).thru(function(p) {
            return n && !p.length && p.push(o), p;
          }));
        });
        function pg() {
          return Pl(this);
        }
        function hg() {
          return new gn(this.value(), this.__chain__);
        }
        function gg() {
          this.__values__ === o && (this.__values__ = Vl(this.value()));
          var e = this.__index__ >= this.__values__.length, n = e ? o : this.__values__[this.__index__++];
          return { done: e, value: n };
        }
        function mg() {
          return this;
        }
        function vg(e) {
          for (var n, t = this; t instanceof Yr; ) {
            var s = El(t);
            s.__index__ = 0, s.__values__ = o, n ? u.__wrapped__ = s : n = s;
            var u = s;
            t = t.__wrapped__;
          }
          return u.__wrapped__ = e, n;
        }
        function yg() {
          var e = this.__wrapped__;
          if (e instanceof he) {
            var n = e;
            return this.__actions__.length && (n = new he(this)), n = n.reverse(), n.__actions__.push({
              func: uo,
              args: [Ki],
              thisArg: o
            }), new gn(n, this.__chain__);
          }
          return this.thru(Ki);
        }
        function bg() {
          return Ka(this.__wrapped__, this.__actions__);
        }
        var xg = no(function(e, n, t) {
          _e.call(e, t) ? ++e[t] : qn(e, t, 1);
        });
        function _g(e, n, t) {
          var s = ie(e) ? ia : fp;
          return t && Xe(e, n, t) && (n = o), s(e, j(n, 3));
        }
        function wg(e, n) {
          var t = ie(e) ? ot : Oa;
          return t(e, j(n, 3));
        }
        var Eg = rl(Sl), Sg = rl(Tl);
        function Tg(e, n) {
          return Ge(co(e, n), 1);
        }
        function Cg(e, n) {
          return Ge(co(e, n), le);
        }
        function Rg(e, n, t) {
          return t = t === o ? 1 : ae(t), Ge(co(e, n), t);
        }
        function Ml(e, n) {
          var t = ie(e) ? pn : lt;
          return t(e, j(n, 3));
        }
        function Al(e, n) {
          var t = ie(e) ? Kf : Ia;
          return t(e, j(n, 3));
        }
        var Ig = no(function(e, n, t) {
          _e.call(e, t) ? e[t].push(n) : qn(e, t, [n]);
        });
        function Og(e, n, t, s) {
          e = en(e) ? e : qt(e), t = t && !s ? ae(t) : 0;
          var u = e.length;
          return t < 0 && (t = We(u + t, 0)), mo(e) ? t <= u && e.indexOf(n, t) > -1 : !!u && Dt(e, n, t) > -1;
        }
        var Pg = ce(function(e, n, t) {
          var s = -1, u = typeof n == "function", p = en(e) ? w(e.length) : [];
          return lt(e, function(m) {
            p[++s] = u ? on(n, m, t) : cr(m, n, t);
          }), p;
        }), Mg = no(function(e, n, t) {
          qn(e, t, n);
        });
        function co(e, n) {
          var t = ie(e) ? Ae : Da;
          return t(e, j(n, 3));
        }
        function Ag(e, n, t, s) {
          return e == null ? [] : (ie(n) || (n = n == null ? [] : [n]), t = s ? o : t, ie(t) || (t = t == null ? [] : [t]), $a(e, n, t));
        }
        var Ng = no(function(e, n, t) {
          e[t ? 0 : 1].push(n);
        }, function() {
          return [[], []];
        });
        function Lg(e, n, t) {
          var s = ie(e) ? ii : ua, u = arguments.length < 3;
          return s(e, j(n, 4), t, u, lt);
        }
        function Dg(e, n, t) {
          var s = ie(e) ? qf : ua, u = arguments.length < 3;
          return s(e, j(n, 4), t, u, Ia);
        }
        function kg(e, n) {
          var t = ie(e) ? ot : Oa;
          return t(e, ho(j(n, 3)));
        }
        function Bg(e) {
          var n = ie(e) ? Sa : Op;
          return n(e);
        }
        function Fg(e, n, t) {
          (t ? Xe(e, n, t) : n === o) ? n = 1 : n = ae(n);
          var s = ie(e) ? sp : Pp;
          return s(e, n);
        }
        function $g(e) {
          var n = ie(e) ? ap : Ap;
          return n(e);
        }
        function zg(e) {
          if (e == null)
            return 0;
          if (en(e))
            return mo(e) ? Bt(e) : e.length;
          var n = qe(e);
          return n == De || n == Ie ? e.size : Si(e).length;
        }
        function Wg(e, n, t) {
          var s = ie(e) ? si : Np;
          return t && Xe(e, n, t) && (n = o), s(e, j(n, 3));
        }
        var Ug = ce(function(e, n) {
          if (e == null)
            return [];
          var t = n.length;
          return t > 1 && Xe(e, n[0], n[1]) ? n = [] : t > 2 && Xe(n[0], n[1], n[2]) && (n = [n[0]]), $a(e, Ge(n, 1), []);
        }), fo = wd || function() {
          return Ve.Date.now();
        };
        function Hg(e, n) {
          if (typeof n != "function")
            throw new hn(h);
          return e = ae(e), function() {
            if (--e < 1)
              return n.apply(this, arguments);
          };
        }
        function Nl(e, n, t) {
          return n = t ? o : n, n = e && n == null ? e.length : n, Yn(e, W, o, o, o, o, n);
        }
        function Ll(e, n) {
          var t;
          if (typeof n != "function")
            throw new hn(h);
          return e = ae(e), function() {
            return --e > 0 && (t = n.apply(this, arguments)), e <= 1 && (n = o), t;
          };
        }
        var Yi = ce(function(e, n, t) {
          var s = z;
          if (t.length) {
            var u = st(t, Gt(Yi));
            s |= U;
          }
          return Yn(e, s, n, t, u);
        }), Dl = ce(function(e, n, t) {
          var s = z | B;
          if (t.length) {
            var u = st(t, Gt(Dl));
            s |= U;
          }
          return Yn(n, s, e, t, u);
        });
        function kl(e, n, t) {
          n = t ? o : n;
          var s = Yn(e, L, o, o, o, o, o, n);
          return s.placeholder = kl.placeholder, s;
        }
        function Bl(e, n, t) {
          n = t ? o : n;
          var s = Yn(e, D, o, o, o, o, o, n);
          return s.placeholder = Bl.placeholder, s;
        }
        function Fl(e, n, t) {
          var s, u, p, m, v, _, I = 0, O = !1, P = !1, F = !0;
          if (typeof e != "function")
            throw new hn(h);
          n = bn(n) || 0, Ne(t) && (O = !!t.leading, P = "maxWait" in t, p = P ? We(bn(t.maxWait) || 0, n) : p, F = "trailing" in t ? !!t.trailing : F);
          function Y($e) {
            var An = s, Qn = u;
            return s = u = o, I = $e, m = e.apply(Qn, An), m;
          }
          function J($e) {
            return I = $e, v = gr(pe, n), O ? Y($e) : m;
          }
          function ue($e) {
            var An = $e - _, Qn = $e - I, ru = n - An;
            return P ? Ke(ru, p - Qn) : ru;
          }
          function Q($e) {
            var An = $e - _, Qn = $e - I;
            return _ === o || An >= n || An < 0 || P && Qn >= p;
          }
          function pe() {
            var $e = fo();
            if (Q($e))
              return me($e);
            v = gr(pe, ue($e));
          }
          function me($e) {
            return v = o, F && s ? Y($e) : (s = u = o, m);
          }
          function un() {
            v !== o && Ya(v), I = 0, s = _ = u = v = o;
          }
          function Ze() {
            return v === o ? m : me(fo());
          }
          function cn() {
            var $e = fo(), An = Q($e);
            if (s = arguments, u = this, _ = $e, An) {
              if (v === o)
                return J(_);
              if (P)
                return Ya(v), v = gr(pe, n), Y(_);
            }
            return v === o && (v = gr(pe, n)), m;
          }
          return cn.cancel = un, cn.flush = Ze, cn;
        }
        var Vg = ce(function(e, n) {
          return Ra(e, 1, n);
        }), Gg = ce(function(e, n, t) {
          return Ra(e, bn(n) || 0, t);
        });
        function Kg(e) {
          return Yn(e, Z);
        }
        function po(e, n) {
          if (typeof e != "function" || n != null && typeof n != "function")
            throw new hn(h);
          var t = function() {
            var s = arguments, u = n ? n.apply(this, s) : s[0], p = t.cache;
            if (p.has(u))
              return p.get(u);
            var m = e.apply(this, s);
            return t.cache = p.set(u, m) || p, m;
          };
          return t.cache = new (po.Cache || Kn)(), t;
        }
        po.Cache = Kn;
        function ho(e) {
          if (typeof e != "function")
            throw new hn(h);
          return function() {
            var n = arguments;
            switch (n.length) {
              case 0:
                return !e.call(this);
              case 1:
                return !e.call(this, n[0]);
              case 2:
                return !e.call(this, n[0], n[1]);
              case 3:
                return !e.call(this, n[0], n[1], n[2]);
            }
            return !e.apply(this, n);
          };
        }
        function qg(e) {
          return Ll(2, e);
        }
        var Yg = Lp(function(e, n) {
          n = n.length == 1 && ie(n[0]) ? Ae(n[0], sn(j())) : Ae(Ge(n, 1), sn(j()));
          var t = n.length;
          return ce(function(s) {
            for (var u = -1, p = Ke(s.length, t); ++u < p; )
              s[u] = n[u].call(this, s[u]);
            return on(e, this, s);
          });
        }), Xi = ce(function(e, n) {
          var t = st(n, Gt(Xi));
          return Yn(e, U, o, n, t);
        }), $l = ce(function(e, n) {
          var t = st(n, Gt($l));
          return Yn(e, q, o, n, t);
        }), Xg = Xn(function(e, n) {
          return Yn(e, G, o, o, o, n);
        });
        function Zg(e, n) {
          if (typeof e != "function")
            throw new hn(h);
          return n = n === o ? n : ae(n), ce(e, n);
        }
        function jg(e, n) {
          if (typeof e != "function")
            throw new hn(h);
          return n = n == null ? 0 : We(ae(n), 0), ce(function(t) {
            var s = t[n], u = ft(t, 0, n);
            return s && it(u, s), on(e, this, u);
          });
        }
        function Jg(e, n, t) {
          var s = !0, u = !0;
          if (typeof e != "function")
            throw new hn(h);
          return Ne(t) && (s = "leading" in t ? !!t.leading : s, u = "trailing" in t ? !!t.trailing : u), Fl(e, n, {
            leading: s,
            maxWait: n,
            trailing: u
          });
        }
        function Qg(e) {
          return Nl(e, 1);
        }
        function em(e, n) {
          return Xi(Ni(n), e);
        }
        function nm() {
          if (!arguments.length)
            return [];
          var e = arguments[0];
          return ie(e) ? e : [e];
        }
        function tm(e) {
          return mn(e, M);
        }
        function rm(e, n) {
          return n = typeof n == "function" ? n : o, mn(e, M, n);
        }
        function om(e) {
          return mn(e, R | M);
        }
        function im(e, n) {
          return n = typeof n == "function" ? n : o, mn(e, R | M, n);
        }
        function sm(e, n) {
          return n == null || Ca(e, n, Ue(n));
        }
        function Mn(e, n) {
          return e === n || e !== e && n !== n;
        }
        var am = io(_i), lm = io(function(e, n) {
          return e >= n;
        }), Et = Aa(/* @__PURE__ */ (function() {
          return arguments;
        })()) ? Aa : function(e) {
          return ke(e) && _e.call(e, "callee") && !ya.call(e, "callee");
        }, ie = w.isArray, um = Qs ? sn(Qs) : vp;
        function en(e) {
          return e != null && go(e.length) && !jn(e);
        }
        function Fe(e) {
          return ke(e) && en(e);
        }
        function cm(e) {
          return e === !0 || e === !1 || ke(e) && Ye(e) == Tn;
        }
        var dt = Sd || ss, fm = ea ? sn(ea) : yp;
        function dm(e) {
          return ke(e) && e.nodeType === 1 && !mr(e);
        }
        function pm(e) {
          if (e == null)
            return !0;
          if (en(e) && (ie(e) || typeof e == "string" || typeof e.splice == "function" || dt(e) || Kt(e) || Et(e)))
            return !e.length;
          var n = qe(e);
          if (n == De || n == Ie)
            return !e.size;
          if (hr(e))
            return !Si(e).length;
          for (var t in e)
            if (_e.call(e, t))
              return !1;
          return !0;
        }
        function hm(e, n) {
          return fr(e, n);
        }
        function gm(e, n, t) {
          t = typeof t == "function" ? t : o;
          var s = t ? t(e, n) : o;
          return s === o ? fr(e, n, o, t) : !!s;
        }
        function Zi(e) {
          if (!ke(e))
            return !1;
          var n = Ye(e);
          return n == ye || n == ve || typeof e.message == "string" && typeof e.name == "string" && !mr(e);
        }
        function mm(e) {
          return typeof e == "number" && xa(e);
        }
        function jn(e) {
          if (!Ne(e))
            return !1;
          var n = Ye(e);
          return n == Le || n == fn || n == ht || n == Vn;
        }
        function zl(e) {
          return typeof e == "number" && e == ae(e);
        }
        function go(e) {
          return typeof e == "number" && e > -1 && e % 1 == 0 && e <= Ce;
        }
        function Ne(e) {
          var n = typeof e;
          return e != null && (n == "object" || n == "function");
        }
        function ke(e) {
          return e != null && typeof e == "object";
        }
        var Wl = na ? sn(na) : xp;
        function vm(e, n) {
          return e === n || Ei(e, n, zi(n));
        }
        function ym(e, n, t) {
          return t = typeof t == "function" ? t : o, Ei(e, n, zi(n), t);
        }
        function bm(e) {
          return Ul(e) && e != +e;
        }
        function xm(e) {
          if (rh(e))
            throw new oe(c);
          return Na(e);
        }
        function _m(e) {
          return e === null;
        }
        function wm(e) {
          return e == null;
        }
        function Ul(e) {
          return typeof e == "number" || ke(e) && Ye(e) == Je;
        }
        function mr(e) {
          if (!ke(e) || Ye(e) != He)
            return !1;
          var n = Wr(e);
          if (n === null)
            return !0;
          var t = _e.call(n, "constructor") && n.constructor;
          return typeof t == "function" && t instanceof t && Br.call(t) == yd;
        }
        var ji = ta ? sn(ta) : _p;
        function Em(e) {
          return zl(e) && e >= -Ce && e <= Ce;
        }
        var Hl = ra ? sn(ra) : wp;
        function mo(e) {
          return typeof e == "string" || !ie(e) && ke(e) && Ye(e) == ne;
        }
        function ln(e) {
          return typeof e == "symbol" || ke(e) && Ye(e) == Ir;
        }
        var Kt = oa ? sn(oa) : Ep;
        function Sm(e) {
          return e === o;
        }
        function Tm(e) {
          return ke(e) && qe(e) == er;
        }
        function Cm(e) {
          return ke(e) && Ye(e) == Wc;
        }
        var Rm = io(Ti), Im = io(function(e, n) {
          return e <= n;
        });
        function Vl(e) {
          if (!e)
            return [];
          if (en(e))
            return mo(e) ? On(e) : Qe(e);
          if (rr && e[rr])
            return sd(e[rr]());
          var n = qe(e), t = n == De ? di : n == Ie ? Lr : qt;
          return t(e);
        }
        function Jn(e) {
          if (!e)
            return e === 0 ? e : 0;
          if (e = bn(e), e === le || e === -le) {
            var n = e < 0 ? -1 : 1;
            return n * X;
          }
          return e === e ? e : 0;
        }
        function ae(e) {
          var n = Jn(e), t = n % 1;
          return n === n ? t ? n - t : n : 0;
        }
        function Gl(e) {
          return e ? bt(ae(e), 0, Me) : 0;
        }
        function bn(e) {
          if (typeof e == "number")
            return e;
          if (ln(e))
            return we;
          if (Ne(e)) {
            var n = typeof e.valueOf == "function" ? e.valueOf() : e;
            e = Ne(n) ? n + "" : n;
          }
          if (typeof e != "string")
            return e === 0 ? e : +e;
          e = ca(e);
          var t = uf.test(e);
          return t || ff.test(e) ? Hf(e.slice(2), t ? 2 : 8) : lf.test(e) ? we : +e;
        }
        function Kl(e) {
          return Fn(e, nn(e));
        }
        function Om(e) {
          return e ? bt(ae(e), -Ce, Ce) : e === 0 ? e : 0;
        }
        function xe(e) {
          return e == null ? "" : an(e);
        }
        var Pm = Ht(function(e, n) {
          if (hr(n) || en(n)) {
            Fn(n, Ue(n), e);
            return;
          }
          for (var t in n)
            _e.call(n, t) && lr(e, t, n[t]);
        }), ql = Ht(function(e, n) {
          Fn(n, nn(n), e);
        }), vo = Ht(function(e, n, t, s) {
          Fn(n, nn(n), e, s);
        }), Mm = Ht(function(e, n, t, s) {
          Fn(n, Ue(n), e, s);
        }), Am = Xn(yi);
        function Nm(e, n) {
          var t = Ut(e);
          return n == null ? t : Ta(t, n);
        }
        var Lm = ce(function(e, n) {
          e = Ee(e);
          var t = -1, s = n.length, u = s > 2 ? n[2] : o;
          for (u && Xe(n[0], n[1], u) && (s = 1); ++t < s; )
            for (var p = n[t], m = nn(p), v = -1, _ = m.length; ++v < _; ) {
              var I = m[v], O = e[I];
              (O === o || Mn(O, $t[I]) && !_e.call(e, I)) && (e[I] = p[I]);
            }
          return e;
        }), Dm = ce(function(e) {
          return e.push(o, cl), on(Yl, o, e);
        });
        function km(e, n) {
          return sa(e, j(n, 3), Bn);
        }
        function Bm(e, n) {
          return sa(e, j(n, 3), xi);
        }
        function Fm(e, n) {
          return e == null ? e : bi(e, j(n, 3), nn);
        }
        function $m(e, n) {
          return e == null ? e : Pa(e, j(n, 3), nn);
        }
        function zm(e, n) {
          return e && Bn(e, j(n, 3));
        }
        function Wm(e, n) {
          return e && xi(e, j(n, 3));
        }
        function Um(e) {
          return e == null ? [] : jr(e, Ue(e));
        }
        function Hm(e) {
          return e == null ? [] : jr(e, nn(e));
        }
        function Ji(e, n, t) {
          var s = e == null ? o : xt(e, n);
          return s === o ? t : s;
        }
        function Vm(e, n) {
          return e != null && pl(e, n, pp);
        }
        function Qi(e, n) {
          return e != null && pl(e, n, hp);
        }
        var Gm = il(function(e, n, t) {
          n != null && typeof n.toString != "function" && (n = Fr.call(n)), e[n] = t;
        }, ns(tn)), Km = il(function(e, n, t) {
          n != null && typeof n.toString != "function" && (n = Fr.call(n)), _e.call(e, n) ? e[n].push(t) : e[n] = [t];
        }, j), qm = ce(cr);
        function Ue(e) {
          return en(e) ? Ea(e) : Si(e);
        }
        function nn(e) {
          return en(e) ? Ea(e, !0) : Sp(e);
        }
        function Ym(e, n) {
          var t = {};
          return n = j(n, 3), Bn(e, function(s, u, p) {
            qn(t, n(s, u, p), s);
          }), t;
        }
        function Xm(e, n) {
          var t = {};
          return n = j(n, 3), Bn(e, function(s, u, p) {
            qn(t, u, n(s, u, p));
          }), t;
        }
        var Zm = Ht(function(e, n, t) {
          Jr(e, n, t);
        }), Yl = Ht(function(e, n, t, s) {
          Jr(e, n, t, s);
        }), jm = Xn(function(e, n) {
          var t = {};
          if (e == null)
            return t;
          var s = !1;
          n = Ae(n, function(p) {
            return p = ct(p, e), s || (s = p.length > 1), p;
          }), Fn(e, Fi(e), t), s && (t = mn(t, R | N | M, Gp));
          for (var u = n.length; u--; )
            Pi(t, n[u]);
          return t;
        });
        function Jm(e, n) {
          return Xl(e, ho(j(n)));
        }
        var Qm = Xn(function(e, n) {
          return e == null ? {} : Cp(e, n);
        });
        function Xl(e, n) {
          if (e == null)
            return {};
          var t = Ae(Fi(e), function(s) {
            return [s];
          });
          return n = j(n), za(e, t, function(s, u) {
            return n(s, u[0]);
          });
        }
        function ev(e, n, t) {
          n = ct(n, e);
          var s = -1, u = n.length;
          for (u || (u = 1, e = o); ++s < u; ) {
            var p = e == null ? o : e[$n(n[s])];
            p === o && (s = u, p = t), e = jn(p) ? p.call(e) : p;
          }
          return e;
        }
        function nv(e, n, t) {
          return e == null ? e : dr(e, n, t);
        }
        function tv(e, n, t, s) {
          return s = typeof s == "function" ? s : o, e == null ? e : dr(e, n, t, s);
        }
        var Zl = ll(Ue), jl = ll(nn);
        function rv(e, n, t) {
          var s = ie(e), u = s || dt(e) || Kt(e);
          if (n = j(n, 4), t == null) {
            var p = e && e.constructor;
            u ? t = s ? new p() : [] : Ne(e) ? t = jn(p) ? Ut(Wr(e)) : {} : t = {};
          }
          return (u ? pn : Bn)(e, function(m, v, _) {
            return n(t, m, v, _);
          }), t;
        }
        function ov(e, n) {
          return e == null ? !0 : Pi(e, n);
        }
        function iv(e, n, t) {
          return e == null ? e : Ga(e, n, Ni(t));
        }
        function sv(e, n, t, s) {
          return s = typeof s == "function" ? s : o, e == null ? e : Ga(e, n, Ni(t), s);
        }
        function qt(e) {
          return e == null ? [] : fi(e, Ue(e));
        }
        function av(e) {
          return e == null ? [] : fi(e, nn(e));
        }
        function lv(e, n, t) {
          return t === o && (t = n, n = o), t !== o && (t = bn(t), t = t === t ? t : 0), n !== o && (n = bn(n), n = n === n ? n : 0), bt(bn(e), n, t);
        }
        function uv(e, n, t) {
          return n = Jn(n), t === o ? (t = n, n = 0) : t = Jn(t), e = bn(e), gp(e, n, t);
        }
        function cv(e, n, t) {
          if (t && typeof t != "boolean" && Xe(e, n, t) && (n = t = o), t === o && (typeof n == "boolean" ? (t = n, n = o) : typeof e == "boolean" && (t = e, e = o)), e === o && n === o ? (e = 0, n = 1) : (e = Jn(e), n === o ? (n = e, e = 0) : n = Jn(n)), e > n) {
            var s = e;
            e = n, n = s;
          }
          if (t || e % 1 || n % 1) {
            var u = _a();
            return Ke(e + u * (n - e + Uf("1e-" + ((u + "").length - 1))), n);
          }
          return Ri(e, n);
        }
        var fv = Vt(function(e, n, t) {
          return n = n.toLowerCase(), e + (t ? Jl(n) : n);
        });
        function Jl(e) {
          return es(xe(e).toLowerCase());
        }
        function Ql(e) {
          return e = xe(e), e && e.replace(pf, nd).replace(Af, "");
        }
        function dv(e, n, t) {
          e = xe(e), n = an(n);
          var s = e.length;
          t = t === o ? s : bt(ae(t), 0, s);
          var u = t;
          return t -= n.length, t >= 0 && e.slice(t, u) == n;
        }
        function pv(e) {
          return e = xe(e), e && Kc.test(e) ? e.replace(Ps, td) : e;
        }
        function hv(e) {
          return e = xe(e), e && Jc.test(e) ? e.replace(Xo, "\\$&") : e;
        }
        var gv = Vt(function(e, n, t) {
          return e + (t ? "-" : "") + n.toLowerCase();
        }), mv = Vt(function(e, n, t) {
          return e + (t ? " " : "") + n.toLowerCase();
        }), vv = tl("toLowerCase");
        function yv(e, n, t) {
          e = xe(e), n = ae(n);
          var s = n ? Bt(e) : 0;
          if (!n || s >= n)
            return e;
          var u = (n - s) / 2;
          return oo(Gr(u), t) + e + oo(Vr(u), t);
        }
        function bv(e, n, t) {
          e = xe(e), n = ae(n);
          var s = n ? Bt(e) : 0;
          return n && s < n ? e + oo(n - s, t) : e;
        }
        function xv(e, n, t) {
          e = xe(e), n = ae(n);
          var s = n ? Bt(e) : 0;
          return n && s < n ? oo(n - s, t) + e : e;
        }
        function _v(e, n, t) {
          return t || n == null ? n = 0 : n && (n = +n), Id(xe(e).replace(Zo, ""), n || 0);
        }
        function wv(e, n, t) {
          return (t ? Xe(e, n, t) : n === o) ? n = 1 : n = ae(n), Ii(xe(e), n);
        }
        function Ev() {
          var e = arguments, n = xe(e[0]);
          return e.length < 3 ? n : n.replace(e[1], e[2]);
        }
        var Sv = Vt(function(e, n, t) {
          return e + (t ? "_" : "") + n.toLowerCase();
        });
        function Tv(e, n, t) {
          return t && typeof t != "number" && Xe(e, n, t) && (n = t = o), t = t === o ? Me : t >>> 0, t ? (e = xe(e), e && (typeof n == "string" || n != null && !ji(n)) && (n = an(n), !n && kt(e)) ? ft(On(e), 0, t) : e.split(n, t)) : [];
        }
        var Cv = Vt(function(e, n, t) {
          return e + (t ? " " : "") + es(n);
        });
        function Rv(e, n, t) {
          return e = xe(e), t = t == null ? 0 : bt(ae(t), 0, e.length), n = an(n), e.slice(t, t + n.length) == n;
        }
        function Iv(e, n, t) {
          var s = d.templateSettings;
          t && Xe(e, n, t) && (n = o), e = xe(e), n = vo({}, n, s, ul);
          var u = vo({}, n.imports, s.imports, ul), p = Ue(u), m = fi(u, p), v, _, I = 0, O = n.interpolate || Or, P = "__p += '", F = pi(
            (n.escape || Or).source + "|" + O.source + "|" + (O === Ms ? af : Or).source + "|" + (n.evaluate || Or).source + "|$",
            "g"
          ), Y = "//# sourceURL=" + (_e.call(n, "sourceURL") ? (n.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++Bf + "]") + `
`;
          e.replace(F, function(Q, pe, me, un, Ze, cn) {
            return me || (me = un), P += e.slice(I, cn).replace(hf, rd), pe && (v = !0, P += `' +
__e(` + pe + `) +
'`), Ze && (_ = !0, P += `';
` + Ze + `;
__p += '`), me && (P += `' +
((__t = (` + me + `)) == null ? '' : __t) +
'`), I = cn + Q.length, Q;
          }), P += `';
`;
          var J = _e.call(n, "variable") && n.variable;
          if (!J)
            P = `with (obj) {
` + P + `
}
`;
          else if (of.test(J))
            throw new oe(g);
          P = (_ ? P.replace(Uc, "") : P).replace(Hc, "$1").replace(Vc, "$1;"), P = "function(" + (J || "obj") + `) {
` + (J ? "" : `obj || (obj = {});
`) + "var __t, __p = ''" + (v ? ", __e = _.escape" : "") + (_ ? `, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
` : `;
`) + P + `return __p
}`;
          var ue = nu(function() {
            return be(p, Y + "return " + P).apply(o, m);
          });
          if (ue.source = P, Zi(ue))
            throw ue;
          return ue;
        }
        function Ov(e) {
          return xe(e).toLowerCase();
        }
        function Pv(e) {
          return xe(e).toUpperCase();
        }
        function Mv(e, n, t) {
          if (e = xe(e), e && (t || n === o))
            return ca(e);
          if (!e || !(n = an(n)))
            return e;
          var s = On(e), u = On(n), p = fa(s, u), m = da(s, u) + 1;
          return ft(s, p, m).join("");
        }
        function Av(e, n, t) {
          if (e = xe(e), e && (t || n === o))
            return e.slice(0, ha(e) + 1);
          if (!e || !(n = an(n)))
            return e;
          var s = On(e), u = da(s, On(n)) + 1;
          return ft(s, 0, u).join("");
        }
        function Nv(e, n, t) {
          if (e = xe(e), e && (t || n === o))
            return e.replace(Zo, "");
          if (!e || !(n = an(n)))
            return e;
          var s = On(e), u = fa(s, On(n));
          return ft(s, u).join("");
        }
        function Lv(e, n) {
          var t = ge, s = de;
          if (Ne(n)) {
            var u = "separator" in n ? n.separator : u;
            t = "length" in n ? ae(n.length) : t, s = "omission" in n ? an(n.omission) : s;
          }
          e = xe(e);
          var p = e.length;
          if (kt(e)) {
            var m = On(e);
            p = m.length;
          }
          if (t >= p)
            return e;
          var v = t - Bt(s);
          if (v < 1)
            return s;
          var _ = m ? ft(m, 0, v).join("") : e.slice(0, v);
          if (u === o)
            return _ + s;
          if (m && (v += _.length - v), ji(u)) {
            if (e.slice(v).search(u)) {
              var I, O = _;
              for (u.global || (u = pi(u.source, xe(As.exec(u)) + "g")), u.lastIndex = 0; I = u.exec(O); )
                var P = I.index;
              _ = _.slice(0, P === o ? v : P);
            }
          } else if (e.indexOf(an(u), v) != v) {
            var F = _.lastIndexOf(u);
            F > -1 && (_ = _.slice(0, F));
          }
          return _ + s;
        }
        function Dv(e) {
          return e = xe(e), e && Gc.test(e) ? e.replace(Os, cd) : e;
        }
        var kv = Vt(function(e, n, t) {
          return e + (t ? " " : "") + n.toUpperCase();
        }), es = tl("toUpperCase");
        function eu(e, n, t) {
          return e = xe(e), n = t ? o : n, n === o ? id(e) ? pd(e) : Zf(e) : e.match(n) || [];
        }
        var nu = ce(function(e, n) {
          try {
            return on(e, o, n);
          } catch (t) {
            return Zi(t) ? t : new oe(t);
          }
        }), Bv = Xn(function(e, n) {
          return pn(n, function(t) {
            t = $n(t), qn(e, t, Yi(e[t], e));
          }), e;
        });
        function Fv(e) {
          var n = e == null ? 0 : e.length, t = j();
          return e = n ? Ae(e, function(s) {
            if (typeof s[1] != "function")
              throw new hn(h);
            return [t(s[0]), s[1]];
          }) : [], ce(function(s) {
            for (var u = -1; ++u < n; ) {
              var p = e[u];
              if (on(p[0], this, s))
                return on(p[1], this, s);
            }
          });
        }
        function $v(e) {
          return cp(mn(e, R));
        }
        function ns(e) {
          return function() {
            return e;
          };
        }
        function zv(e, n) {
          return e == null || e !== e ? n : e;
        }
        var Wv = ol(), Uv = ol(!0);
        function tn(e) {
          return e;
        }
        function ts(e) {
          return La(typeof e == "function" ? e : mn(e, R));
        }
        function Hv(e) {
          return ka(mn(e, R));
        }
        function Vv(e, n) {
          return Ba(e, mn(n, R));
        }
        var Gv = ce(function(e, n) {
          return function(t) {
            return cr(t, e, n);
          };
        }), Kv = ce(function(e, n) {
          return function(t) {
            return cr(e, t, n);
          };
        });
        function rs(e, n, t) {
          var s = Ue(n), u = jr(n, s);
          t == null && !(Ne(n) && (u.length || !s.length)) && (t = n, n = e, e = this, u = jr(n, Ue(n)));
          var p = !(Ne(t) && "chain" in t) || !!t.chain, m = jn(e);
          return pn(u, function(v) {
            var _ = n[v];
            e[v] = _, m && (e.prototype[v] = function() {
              var I = this.__chain__;
              if (p || I) {
                var O = e(this.__wrapped__), P = O.__actions__ = Qe(this.__actions__);
                return P.push({ func: _, args: arguments, thisArg: e }), O.__chain__ = I, O;
              }
              return _.apply(e, it([this.value()], arguments));
            });
          }), e;
        }
        function qv() {
          return Ve._ === this && (Ve._ = bd), this;
        }
        function os() {
        }
        function Yv(e) {
          return e = ae(e), ce(function(n) {
            return Fa(n, e);
          });
        }
        var Xv = Di(Ae), Zv = Di(ia), jv = Di(si);
        function tu(e) {
          return Ui(e) ? ai($n(e)) : Rp(e);
        }
        function Jv(e) {
          return function(n) {
            return e == null ? o : xt(e, n);
          };
        }
        var Qv = sl(), e0 = sl(!0);
        function is() {
          return [];
        }
        function ss() {
          return !1;
        }
        function n0() {
          return {};
        }
        function t0() {
          return "";
        }
        function r0() {
          return !0;
        }
        function o0(e, n) {
          if (e = ae(e), e < 1 || e > Ce)
            return [];
          var t = Me, s = Ke(e, Me);
          n = j(n), e -= Me;
          for (var u = ci(s, n); ++t < e; )
            n(t);
          return u;
        }
        function i0(e) {
          return ie(e) ? Ae(e, $n) : ln(e) ? [e] : Qe(wl(xe(e)));
        }
        function s0(e) {
          var n = ++vd;
          return xe(e) + n;
        }
        var a0 = ro(function(e, n) {
          return e + n;
        }, 0), l0 = ki("ceil"), u0 = ro(function(e, n) {
          return e / n;
        }, 1), c0 = ki("floor");
        function f0(e) {
          return e && e.length ? Zr(e, tn, _i) : o;
        }
        function d0(e, n) {
          return e && e.length ? Zr(e, j(n, 2), _i) : o;
        }
        function p0(e) {
          return la(e, tn);
        }
        function h0(e, n) {
          return la(e, j(n, 2));
        }
        function g0(e) {
          return e && e.length ? Zr(e, tn, Ti) : o;
        }
        function m0(e, n) {
          return e && e.length ? Zr(e, j(n, 2), Ti) : o;
        }
        var v0 = ro(function(e, n) {
          return e * n;
        }, 1), y0 = ki("round"), b0 = ro(function(e, n) {
          return e - n;
        }, 0);
        function x0(e) {
          return e && e.length ? ui(e, tn) : 0;
        }
        function _0(e, n) {
          return e && e.length ? ui(e, j(n, 2)) : 0;
        }
        return d.after = Hg, d.ary = Nl, d.assign = Pm, d.assignIn = ql, d.assignInWith = vo, d.assignWith = Mm, d.at = Am, d.before = Ll, d.bind = Yi, d.bindAll = Bv, d.bindKey = Dl, d.castArray = nm, d.chain = Pl, d.chunk = ch, d.compact = fh, d.concat = dh, d.cond = Fv, d.conforms = $v, d.constant = ns, d.countBy = xg, d.create = Nm, d.curry = kl, d.curryRight = Bl, d.debounce = Fl, d.defaults = Lm, d.defaultsDeep = Dm, d.defer = Vg, d.delay = Gg, d.difference = ph, d.differenceBy = hh, d.differenceWith = gh, d.drop = mh, d.dropRight = vh, d.dropRightWhile = yh, d.dropWhile = bh, d.fill = xh, d.filter = wg, d.flatMap = Tg, d.flatMapDeep = Cg, d.flatMapDepth = Rg, d.flatten = Cl, d.flattenDeep = _h, d.flattenDepth = wh, d.flip = Kg, d.flow = Wv, d.flowRight = Uv, d.fromPairs = Eh, d.functions = Um, d.functionsIn = Hm, d.groupBy = Ig, d.initial = Th, d.intersection = Ch, d.intersectionBy = Rh, d.intersectionWith = Ih, d.invert = Gm, d.invertBy = Km, d.invokeMap = Pg, d.iteratee = ts, d.keyBy = Mg, d.keys = Ue, d.keysIn = nn, d.map = co, d.mapKeys = Ym, d.mapValues = Xm, d.matches = Hv, d.matchesProperty = Vv, d.memoize = po, d.merge = Zm, d.mergeWith = Yl, d.method = Gv, d.methodOf = Kv, d.mixin = rs, d.negate = ho, d.nthArg = Yv, d.omit = jm, d.omitBy = Jm, d.once = qg, d.orderBy = Ag, d.over = Xv, d.overArgs = Yg, d.overEvery = Zv, d.overSome = jv, d.partial = Xi, d.partialRight = $l, d.partition = Ng, d.pick = Qm, d.pickBy = Xl, d.property = tu, d.propertyOf = Jv, d.pull = Ah, d.pullAll = Il, d.pullAllBy = Nh, d.pullAllWith = Lh, d.pullAt = Dh, d.range = Qv, d.rangeRight = e0, d.rearg = Xg, d.reject = kg, d.remove = kh, d.rest = Zg, d.reverse = Ki, d.sampleSize = Fg, d.set = nv, d.setWith = tv, d.shuffle = $g, d.slice = Bh, d.sortBy = Ug, d.sortedUniq = Vh, d.sortedUniqBy = Gh, d.split = Tv, d.spread = jg, d.tail = Kh, d.take = qh, d.takeRight = Yh, d.takeRightWhile = Xh, d.takeWhile = Zh, d.tap = fg, d.throttle = Jg, d.thru = uo, d.toArray = Vl, d.toPairs = Zl, d.toPairsIn = jl, d.toPath = i0, d.toPlainObject = Kl, d.transform = rv, d.unary = Qg, d.union = jh, d.unionBy = Jh, d.unionWith = Qh, d.uniq = eg, d.uniqBy = ng, d.uniqWith = tg, d.unset = ov, d.unzip = qi, d.unzipWith = Ol, d.update = iv, d.updateWith = sv, d.values = qt, d.valuesIn = av, d.without = rg, d.words = eu, d.wrap = em, d.xor = og, d.xorBy = ig, d.xorWith = sg, d.zip = ag, d.zipObject = lg, d.zipObjectDeep = ug, d.zipWith = cg, d.entries = Zl, d.entriesIn = jl, d.extend = ql, d.extendWith = vo, rs(d, d), d.add = a0, d.attempt = nu, d.camelCase = fv, d.capitalize = Jl, d.ceil = l0, d.clamp = lv, d.clone = tm, d.cloneDeep = om, d.cloneDeepWith = im, d.cloneWith = rm, d.conformsTo = sm, d.deburr = Ql, d.defaultTo = zv, d.divide = u0, d.endsWith = dv, d.eq = Mn, d.escape = pv, d.escapeRegExp = hv, d.every = _g, d.find = Eg, d.findIndex = Sl, d.findKey = km, d.findLast = Sg, d.findLastIndex = Tl, d.findLastKey = Bm, d.floor = c0, d.forEach = Ml, d.forEachRight = Al, d.forIn = Fm, d.forInRight = $m, d.forOwn = zm, d.forOwnRight = Wm, d.get = Ji, d.gt = am, d.gte = lm, d.has = Vm, d.hasIn = Qi, d.head = Rl, d.identity = tn, d.includes = Og, d.indexOf = Sh, d.inRange = uv, d.invoke = qm, d.isArguments = Et, d.isArray = ie, d.isArrayBuffer = um, d.isArrayLike = en, d.isArrayLikeObject = Fe, d.isBoolean = cm, d.isBuffer = dt, d.isDate = fm, d.isElement = dm, d.isEmpty = pm, d.isEqual = hm, d.isEqualWith = gm, d.isError = Zi, d.isFinite = mm, d.isFunction = jn, d.isInteger = zl, d.isLength = go, d.isMap = Wl, d.isMatch = vm, d.isMatchWith = ym, d.isNaN = bm, d.isNative = xm, d.isNil = wm, d.isNull = _m, d.isNumber = Ul, d.isObject = Ne, d.isObjectLike = ke, d.isPlainObject = mr, d.isRegExp = ji, d.isSafeInteger = Em, d.isSet = Hl, d.isString = mo, d.isSymbol = ln, d.isTypedArray = Kt, d.isUndefined = Sm, d.isWeakMap = Tm, d.isWeakSet = Cm, d.join = Oh, d.kebabCase = gv, d.last = yn, d.lastIndexOf = Ph, d.lowerCase = mv, d.lowerFirst = vv, d.lt = Rm, d.lte = Im, d.max = f0, d.maxBy = d0, d.mean = p0, d.meanBy = h0, d.min = g0, d.minBy = m0, d.stubArray = is, d.stubFalse = ss, d.stubObject = n0, d.stubString = t0, d.stubTrue = r0, d.multiply = v0, d.nth = Mh, d.noConflict = qv, d.noop = os, d.now = fo, d.pad = yv, d.padEnd = bv, d.padStart = xv, d.parseInt = _v, d.random = cv, d.reduce = Lg, d.reduceRight = Dg, d.repeat = wv, d.replace = Ev, d.result = ev, d.round = y0, d.runInContext = x, d.sample = Bg, d.size = zg, d.snakeCase = Sv, d.some = Wg, d.sortedIndex = Fh, d.sortedIndexBy = $h, d.sortedIndexOf = zh, d.sortedLastIndex = Wh, d.sortedLastIndexBy = Uh, d.sortedLastIndexOf = Hh, d.startCase = Cv, d.startsWith = Rv, d.subtract = b0, d.sum = x0, d.sumBy = _0, d.template = Iv, d.times = o0, d.toFinite = Jn, d.toInteger = ae, d.toLength = Gl, d.toLower = Ov, d.toNumber = bn, d.toSafeInteger = Om, d.toString = xe, d.toUpper = Pv, d.trim = Mv, d.trimEnd = Av, d.trimStart = Nv, d.truncate = Lv, d.unescape = Dv, d.uniqueId = s0, d.upperCase = kv, d.upperFirst = es, d.each = Ml, d.eachRight = Al, d.first = Rl, rs(d, (function() {
          var e = {};
          return Bn(d, function(n, t) {
            _e.call(d.prototype, t) || (e[t] = n);
          }), e;
        })(), { chain: !1 }), d.VERSION = l, pn(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(e) {
          d[e].placeholder = d;
        }), pn(["drop", "take"], function(e, n) {
          he.prototype[e] = function(t) {
            t = t === o ? 1 : We(ae(t), 0);
            var s = this.__filtered__ && !n ? new he(this) : this.clone();
            return s.__filtered__ ? s.__takeCount__ = Ke(t, s.__takeCount__) : s.__views__.push({
              size: Ke(t, Me),
              type: e + (s.__dir__ < 0 ? "Right" : "")
            }), s;
          }, he.prototype[e + "Right"] = function(t) {
            return this.reverse()[e](t).reverse();
          };
        }), pn(["filter", "map", "takeWhile"], function(e, n) {
          var t = n + 1, s = t == te || t == K;
          he.prototype[e] = function(u) {
            var p = this.clone();
            return p.__iteratees__.push({
              iteratee: j(u, 3),
              type: t
            }), p.__filtered__ = p.__filtered__ || s, p;
          };
        }), pn(["head", "last"], function(e, n) {
          var t = "take" + (n ? "Right" : "");
          he.prototype[e] = function() {
            return this[t](1).value()[0];
          };
        }), pn(["initial", "tail"], function(e, n) {
          var t = "drop" + (n ? "" : "Right");
          he.prototype[e] = function() {
            return this.__filtered__ ? new he(this) : this[t](1);
          };
        }), he.prototype.compact = function() {
          return this.filter(tn);
        }, he.prototype.find = function(e) {
          return this.filter(e).head();
        }, he.prototype.findLast = function(e) {
          return this.reverse().find(e);
        }, he.prototype.invokeMap = ce(function(e, n) {
          return typeof e == "function" ? new he(this) : this.map(function(t) {
            return cr(t, e, n);
          });
        }), he.prototype.reject = function(e) {
          return this.filter(ho(j(e)));
        }, he.prototype.slice = function(e, n) {
          e = ae(e);
          var t = this;
          return t.__filtered__ && (e > 0 || n < 0) ? new he(t) : (e < 0 ? t = t.takeRight(-e) : e && (t = t.drop(e)), n !== o && (n = ae(n), t = n < 0 ? t.dropRight(-n) : t.take(n - e)), t);
        }, he.prototype.takeRightWhile = function(e) {
          return this.reverse().takeWhile(e).reverse();
        }, he.prototype.toArray = function() {
          return this.take(Me);
        }, Bn(he.prototype, function(e, n) {
          var t = /^(?:filter|find|map|reject)|While$/.test(n), s = /^(?:head|last)$/.test(n), u = d[s ? "take" + (n == "last" ? "Right" : "") : n], p = s || /^find/.test(n);
          u && (d.prototype[n] = function() {
            var m = this.__wrapped__, v = s ? [1] : arguments, _ = m instanceof he, I = v[0], O = _ || ie(m), P = function(pe) {
              var me = u.apply(d, it([pe], v));
              return s && F ? me[0] : me;
            };
            O && t && typeof I == "function" && I.length != 1 && (_ = O = !1);
            var F = this.__chain__, Y = !!this.__actions__.length, J = p && !F, ue = _ && !Y;
            if (!p && O) {
              m = ue ? m : new he(this);
              var Q = e.apply(m, v);
              return Q.__actions__.push({ func: uo, args: [P], thisArg: o }), new gn(Q, F);
            }
            return J && ue ? e.apply(this, v) : (Q = this.thru(P), J ? s ? Q.value()[0] : Q.value() : Q);
          });
        }), pn(["pop", "push", "shift", "sort", "splice", "unshift"], function(e) {
          var n = Dr[e], t = /^(?:push|sort|unshift)$/.test(e) ? "tap" : "thru", s = /^(?:pop|shift)$/.test(e);
          d.prototype[e] = function() {
            var u = arguments;
            if (s && !this.__chain__) {
              var p = this.value();
              return n.apply(ie(p) ? p : [], u);
            }
            return this[t](function(m) {
              return n.apply(ie(m) ? m : [], u);
            });
          };
        }), Bn(he.prototype, function(e, n) {
          var t = d[n];
          if (t) {
            var s = t.name + "";
            _e.call(Wt, s) || (Wt[s] = []), Wt[s].push({ name: n, func: t });
          }
        }), Wt[to(o, B).name] = [{
          name: "wrapper",
          func: o
        }], he.prototype.clone = Dd, he.prototype.reverse = kd, he.prototype.value = Bd, d.prototype.at = dg, d.prototype.chain = pg, d.prototype.commit = hg, d.prototype.next = gg, d.prototype.plant = vg, d.prototype.reverse = yg, d.prototype.toJSON = d.prototype.valueOf = d.prototype.value = bg, d.prototype.first = d.prototype.head, rr && (d.prototype[rr] = mg), d;
      }), Ft = hd();
      gt ? ((gt.exports = Ft)._ = Ft, ti._ = Ft) : Ve._ = Ft;
    }).call(I1);
  })(_r, _r.exports)), _r.exports;
}
var P1 = O1();
const X1 = ({
  text: r,
  length: i = 150,
  omission: o = "...",
  separator: l,
  expandText: f = "More",
  collapseText: c = "Less",
  variant: h = "body1",
  color: g,
  sx: y,
  className: b
}) => {
  const [E, R] = Jt(!1);
  if (!r?.trim())
    return null;
  const N = P1.truncate(r, { length: i, omission: o, separator: l });
  return /* @__PURE__ */ S(ee, { sx: y, className: b, children: /* @__PURE__ */ fe(
    Be,
    {
      variant: h,
      color: g,
      sx: {
        whiteSpace: "pre-wrap",
        wordBreak: "break-word"
      },
      children: [
        E ? r : N,
        " ",
        N !== r && /* @__PURE__ */ S(
          U0,
          {
            color: "primaryDark",
            variant: "text",
            size: "small",
            onClick: () => {
              R(!E);
            },
            "aria-label": E ? "Show less content" : "Show more content",
            "aria-expanded": E,
            sx: {
              minWidth: "auto",
              padding: 0,
              textTransform: "none",
              fontWeight: 500,
              fontSize: "inherit",
              lineHeight: "inherit",
              verticalAlign: "baseline",
              "&:hover, &:focus-visible": {
                backgroundColor: "transparent",
                textDecoration: "underline"
              }
            },
            children: E ? c : f
          }
        )
      ]
    }
  ) });
}, M1 = _s([/* @__PURE__ */ S("path", {
  d: "m10.1 15.9 1.42-1.42C8.79 12.05 7 10.41 7 8.85 7 7.8 7.8 7 8.85 7c1.11 0 1.54.65 2.68 2h.93c1.12-1.31 1.53-2 2.68-2 .87 0 1.55.54 1.77 1.32.35-.04.68-.06 1-.06.36 0 .7.03 1.03.08C18.7 6.43 17.13 5 15.15 5c-.12 0-.23.03-.35.04.12-.33.2-.67.2-1.04 0-1.66-1.34-3-3-3S9 2.34 9 4c0 .37.08.71.2 1.04-.12-.01-.23-.04-.35-.04C6.69 5 5 6.69 5 8.85c0 2.42 2.04 4.31 5.1 7.05"
}, "0"), /* @__PURE__ */ S("path", {
  d: "M22.5 16.24c-.32-.18-.66-.29-1-.35.07-.1.15-.18.21-.28 1.08-1.87.46-4.18-1.41-5.26-2.09-1.21-4.76-.39-8.65.9l.52 1.94c3.47-1.14 5.79-1.88 7.14-1.1.91.53 1.2 1.61.68 2.53-.56.96-1.33 1-3.07 1.32l-.47.81c.58 1.62.97 2.33.39 3.32-.53.91-1.61 1.2-2.53.68-.06-.03-.11-.09-.17-.13-.3.67-.64 1.24-1.03 1.73.07.04.13.09.2.14 1.87 1.08 4.18.46 5.26-1.41.06-.1.09-.21.14-.32.22.27.48.51.8.69 1.43.83 3.27.34 4.1-1.1s.32-3.29-1.11-4.11"
}, "1"), /* @__PURE__ */ S("path", {
  d: "M12.32 14.01c-.74 3.58-1.27 5.95-2.62 6.73-.91.53-2 .24-2.53-.68-.56-.96-.2-1.66.39-3.32l-.46-.81c-1.7-.31-2.5-.33-3.07-1.32-.53-.91-.24-2 .68-2.53.09-.05.19-.08.29-.11-.35-.56-.64-1.17-.82-1.85-.16.07-.32.14-.48.23-1.87 1.08-2.49 3.39-1.41 5.26.06.1.14.18.21.28-.34.06-.68.17-1 .35-1.43.83-1.93 2.66-1.1 4.1s2.66 1.93 4.1 1.1c.32-.18.58-.42.8-.69.05.11.08.22.14.32 1.08 1.87 3.39 2.49 5.26 1.41 2.09-1.21 2.71-3.93 3.55-7.94z"
}, "2")], "Diversity2"), Z1 = ({ icon: r, color: i, size: o = 44, sx: l, className: f }) => {
  const c = o * 0.6;
  return /* @__PURE__ */ S(
    ee,
    {
      className: f,
      sx: {
        width: o,
        height: o,
        borderRadius: "50%",
        backgroundColor: Nu(i, 0.15),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...l
      },
      children: r ?? /* @__PURE__ */ S(
        M1,
        {
          sx: {
            fontSize: c,
            color: i
          }
        }
      )
    }
  );
}, j1 = ({ icon: r, time: i, title: o, action: l, sx: f, className: c }) => /* @__PURE__ */ fe(
  ee,
  {
    className: c,
    sx: {
      display: "flex",
      gap: 1,
      alignItems: "flex-start",
      ...f
    },
    children: [
      /* @__PURE__ */ S(ee, { sx: { flexShrink: 0 }, children: r }),
      /* @__PURE__ */ fe(ee, { sx: { display: "flex", flexDirection: "column", gap: 0.25, minWidth: 0 }, children: [
        /* @__PURE__ */ S(
          Be,
          {
            variant: "body2",
            sx: {
              color: "text.secondary",
              fontSize: "0.875rem"
            },
            children: i
          }
        ),
        /* @__PURE__ */ S(
          Be,
          {
            variant: "body1",
            sx: {
              color: "text.primary"
            },
            children: o
          }
        ),
        l && /* @__PURE__ */ S(ee, { children: l })
      ] })
    ]
  }
), J1 = ({
  label: r,
  color: i,
  component: o,
  size: l = "medium",
  startIcon: f,
  sx: c,
  className: h,
  ...g
}) => {
  const y = Qt(), b = !!o, E = nc(i, y), N = {
    small: {
      fontSize: "0.875rem",
      iconSize: 14
    },
    medium: {
      fontSize: "1rem",
      iconSize: 16
    },
    large: {
      fontSize: "1.125rem",
      iconSize: 18
    }
  }[l];
  return /* @__PURE__ */ fe(
    ee,
    {
      ...o && { component: o },
      className: h,
      sx: {
        background: "none",
        border: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        textDecoration: "none",
        borderRadius: 1,
        color: "inherit",
        p: 0,
        cursor: b ? "pointer" : "default",
        transition: y.transitions.create(["background-color", "transform"], {
          duration: y.transitions.duration.shorter
        }),
        ...b && {
          "&:hover .schedule-item__text, &:focus-visible .schedule-item__text": {
            textDecoration: "underline"
          }
        },
        ...c
      },
      ...g,
      children: [
        /* @__PURE__ */ S(
          ee,
          {
            className: "schedule-item__indicator-bar",
            sx: {
              inlineSize: ".25em",
              blockSize: "1em",
              backgroundColor: E,
              borderRadius: 1
            }
          }
        ),
        f && /* @__PURE__ */ S(
          ee,
          {
            sx: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: E,
              fontSize: N.iconSize,
              "& > svg": {
                fontSize: "inherit"
              }
            },
            children: f
          }
        ),
        /* @__PURE__ */ S(
          Be,
          {
            className: "schedule-item__text",
            component: "span",
            sx: {
              fontSize: N.fontSize,
              lineHeight: 1.5,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            },
            title: r,
            children: r
          }
        )
      ]
    }
  );
}, $c = ({
  children: r,
  sx: i,
  className: o
}) => /* @__PURE__ */ S(
  ko,
  {
    variant: "outlined",
    elevation: 0,
    className: o,
    sx: {
      p: 2,
      ...i
    },
    children: r
  }
), A1 = ({ children: r, action: i, sx: o, className: l }) => /* @__PURE__ */ fe(
  ee,
  {
    className: l,
    sx: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 2,
      ...o
    },
    children: [
      /* @__PURE__ */ S(Be, { variant: "h6", children: r }),
      i && /* @__PURE__ */ S(ee, { children: i })
    ]
  }
), N1 = ({ title: r, children: i, sx: o, className: l }) => /* @__PURE__ */ fe(
  ee,
  {
    className: l,
    sx: {
      "&:not(:last-child)": {
        mb: 2
      },
      ...o
    },
    children: [
      r && /* @__PURE__ */ S(
        Be,
        {
          variant: "h6",
          color: "text.secondary",
          fontWeight: 400,
          sx: {
            mb: 2
          },
          children: r
        }
      ),
      /* @__PURE__ */ S(
        ee,
        {
          sx: {
            display: "flex",
            flexDirection: "column",
            gap: 2
          },
          children: i
        }
      )
    ]
  }
);
$c.Header = A1;
$c.Group = N1;
const L1 = ({
  timestamp: r,
  icon: i,
  name: o,
  description: l,
  isLast: f = !1,
  timestampWidth: c = "140px",
  sx: h,
  className: g
}) => /* @__PURE__ */ fe(
  ee,
  {
    component: "li",
    className: g,
    sx: {
      display: "flex",
      gap: 1,
      position: "relative",
      listStyle: "none",
      ...h
    },
    role: "listitem",
    children: [
      /* @__PURE__ */ S(
        ee,
        {
          sx: {
            flexShrink: 0,
            width: c,
            pt: 0.5
          },
          children: /* @__PURE__ */ S(
            Be,
            {
              variant: "body2",
              color: "text.secondary",
              sx: {
                fontSize: "0.875rem"
              },
              children: /* @__PURE__ */ S("time", { children: r })
            }
          )
        }
      ),
      /* @__PURE__ */ fe(
        ee,
        {
          sx: {
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative"
          },
          children: [
            /* @__PURE__ */ S(
              ee,
              {
                sx: {
                  flexShrink: 0,
                  zIndex: 1,
                  color: "primary.main",
                  fontSize: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  "& > *": {
                    fontSize: "inherit",
                    flexShrink: 0
                  }
                },
                "aria-hidden": "true",
                children: i
              }
            ),
            !f && /* @__PURE__ */ S(
              ee,
              {
                sx: {
                  width: "2px",
                  flexGrow: 1,
                  backgroundColor: "primary.main"
                },
                "aria-hidden": "true"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ fe(
        ee,
        {
          sx: {
            display: "flex",
            flexDirection: "column",
            gap: 0.25,
            minWidth: 0,
            pb: 2
          },
          children: [
            /* @__PURE__ */ S(
              Be,
              {
                variant: "body1",
                sx: {
                  fontWeight: 500
                },
                children: o
              }
            ),
            /* @__PURE__ */ S(Be, { variant: "body2", color: "grey.900", children: l })
          ]
        }
      )
    ]
  }
), Q1 = ({
  title: r,
  subHeader: i,
  actions: o,
  items: l,
  emptyMessage: f = "No timeline entries",
  timelineAriaLabel: c = "Timeline",
  sx: h,
  className: g,
  variant: y = "outlined",
  elevation: b = 0
}) => /* @__PURE__ */ fe(
  ko,
  {
    className: g,
    variant: y,
    elevation: b,
    sx: {
      p: 2,
      ...h
    },
    children: [
      (r || o) && /* @__PURE__ */ fe(
        ee,
        {
          sx: {
            display: "flex",
            flexDirection: "column",
            mb: i || l.length > 0 ? 3 : 0,
            gap: 2
          },
          children: [
            r && /* @__PURE__ */ S(Be, { variant: "subtitle1", component: "h2", children: r }),
            o && /* @__PURE__ */ S(
              ee,
              {
                sx: {
                  display: "flex",
                  gap: 1
                },
                children: o
              }
            )
          ]
        }
      ),
      i && /* @__PURE__ */ S(
        Be,
        {
          variant: "subtitle2",
          component: "h3",
          sx: {
            mb: l.length > 0 ? 2 : 0
          },
          children: i
        }
      ),
      l.length > 0 ? /* @__PURE__ */ S(
        ee,
        {
          component: "ul",
          sx: {
            m: 0,
            p: 0
          },
          role: "list",
          "aria-label": c,
          children: l.map((E, R) => /* @__PURE__ */ S(
            L1,
            {
              timestamp: E.timestamp,
              icon: E.icon,
              name: E.name,
              description: E.description,
              isLast: R === l.length - 1
            },
            `${E.timestamp}-${R}`
          ))
        }
      ) : /* @__PURE__ */ S(
        Be,
        {
          variant: "body2",
          sx: {
            color: "text.secondary",
            fontStyle: "italic",
            textAlign: "center",
            py: 2
          },
          role: "status",
          children: f
        }
      )
    ]
  }
);
export {
  Y1 as AccessiblePopover,
  Z1 as ActivityIcon,
  j1 as ActivityItem,
  V1 as ColoredChip,
  Fo as ContextHeader,
  Is as Dropdown,
  X1 as ExpandableText,
  K1 as NavItem,
  q1 as ProgressCard,
  $c as RecentActivity,
  J1 as ScheduleItem,
  Bo as Shell,
  G1 as StepNav,
  Uy as Steps,
  Q1 as TimelineCard,
  L1 as TimelineItem,
  H1 as classNames,
  nc as resolveThemeColor,
  tx as theme,
  ws as useDropdown,
  Ry as useShellContext,
  U1 as useShellState
};
