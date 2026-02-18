import * as Yr from "react";
function me(e, ...r) {
  const t = new URL(`https://mui.com/production-error/?code=${e}`);
  return r.forEach((n) => t.searchParams.append("args[]", n)), `Minified MUI error #${e}; visit ${t} for the full message.`;
}
var co = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function it(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Ie = { exports: {} }, Ne = { exports: {} }, j = {};
var hr;
function at() {
  if (hr) return j;
  hr = 1;
  var e = typeof Symbol == "function" && Symbol.for, r = e ? /* @__PURE__ */ Symbol.for("react.element") : 60103, t = e ? /* @__PURE__ */ Symbol.for("react.portal") : 60106, n = e ? /* @__PURE__ */ Symbol.for("react.fragment") : 60107, i = e ? /* @__PURE__ */ Symbol.for("react.strict_mode") : 60108, a = e ? /* @__PURE__ */ Symbol.for("react.profiler") : 60114, c = e ? /* @__PURE__ */ Symbol.for("react.provider") : 60109, l = e ? /* @__PURE__ */ Symbol.for("react.context") : 60110, f = e ? /* @__PURE__ */ Symbol.for("react.async_mode") : 60111, d = e ? /* @__PURE__ */ Symbol.for("react.concurrent_mode") : 60111, h = e ? /* @__PURE__ */ Symbol.for("react.forward_ref") : 60112, p = e ? /* @__PURE__ */ Symbol.for("react.suspense") : 60113, m = e ? /* @__PURE__ */ Symbol.for("react.suspense_list") : 60120, v = e ? /* @__PURE__ */ Symbol.for("react.memo") : 60115, b = e ? /* @__PURE__ */ Symbol.for("react.lazy") : 60116, s = e ? /* @__PURE__ */ Symbol.for("react.block") : 60121, C = e ? /* @__PURE__ */ Symbol.for("react.fundamental") : 60117, _ = e ? /* @__PURE__ */ Symbol.for("react.responder") : 60118, B = e ? /* @__PURE__ */ Symbol.for("react.scope") : 60119;
  function D(y) {
    if (typeof y == "object" && y !== null) {
      var w = y.$$typeof;
      switch (w) {
        case r:
          switch (y = y.type, y) {
            case f:
            case d:
            case n:
            case a:
            case i:
            case p:
              return y;
            default:
              switch (y = y && y.$$typeof, y) {
                case l:
                case h:
                case b:
                case v:
                case c:
                  return y;
                default:
                  return w;
              }
          }
        case t:
          return w;
      }
    }
  }
  function $(y) {
    return D(y) === d;
  }
  return j.AsyncMode = f, j.ConcurrentMode = d, j.ContextConsumer = l, j.ContextProvider = c, j.Element = r, j.ForwardRef = h, j.Fragment = n, j.Lazy = b, j.Memo = v, j.Portal = t, j.Profiler = a, j.StrictMode = i, j.Suspense = p, j.isAsyncMode = function(y) {
    return $(y) || D(y) === f;
  }, j.isConcurrentMode = $, j.isContextConsumer = function(y) {
    return D(y) === l;
  }, j.isContextProvider = function(y) {
    return D(y) === c;
  }, j.isElement = function(y) {
    return typeof y == "object" && y !== null && y.$$typeof === r;
  }, j.isForwardRef = function(y) {
    return D(y) === h;
  }, j.isFragment = function(y) {
    return D(y) === n;
  }, j.isLazy = function(y) {
    return D(y) === b;
  }, j.isMemo = function(y) {
    return D(y) === v;
  }, j.isPortal = function(y) {
    return D(y) === t;
  }, j.isProfiler = function(y) {
    return D(y) === a;
  }, j.isStrictMode = function(y) {
    return D(y) === i;
  }, j.isSuspense = function(y) {
    return D(y) === p;
  }, j.isValidElementType = function(y) {
    return typeof y == "string" || typeof y == "function" || y === n || y === d || y === a || y === i || y === p || y === m || typeof y == "object" && y !== null && (y.$$typeof === b || y.$$typeof === v || y.$$typeof === c || y.$$typeof === l || y.$$typeof === h || y.$$typeof === C || y.$$typeof === _ || y.$$typeof === B || y.$$typeof === s);
  }, j.typeOf = D, j;
}
var W = {};
var yr;
function st() {
  return yr || (yr = 1, process.env.NODE_ENV !== "production" && (function() {
    var e = typeof Symbol == "function" && Symbol.for, r = e ? /* @__PURE__ */ Symbol.for("react.element") : 60103, t = e ? /* @__PURE__ */ Symbol.for("react.portal") : 60106, n = e ? /* @__PURE__ */ Symbol.for("react.fragment") : 60107, i = e ? /* @__PURE__ */ Symbol.for("react.strict_mode") : 60108, a = e ? /* @__PURE__ */ Symbol.for("react.profiler") : 60114, c = e ? /* @__PURE__ */ Symbol.for("react.provider") : 60109, l = e ? /* @__PURE__ */ Symbol.for("react.context") : 60110, f = e ? /* @__PURE__ */ Symbol.for("react.async_mode") : 60111, d = e ? /* @__PURE__ */ Symbol.for("react.concurrent_mode") : 60111, h = e ? /* @__PURE__ */ Symbol.for("react.forward_ref") : 60112, p = e ? /* @__PURE__ */ Symbol.for("react.suspense") : 60113, m = e ? /* @__PURE__ */ Symbol.for("react.suspense_list") : 60120, v = e ? /* @__PURE__ */ Symbol.for("react.memo") : 60115, b = e ? /* @__PURE__ */ Symbol.for("react.lazy") : 60116, s = e ? /* @__PURE__ */ Symbol.for("react.block") : 60121, C = e ? /* @__PURE__ */ Symbol.for("react.fundamental") : 60117, _ = e ? /* @__PURE__ */ Symbol.for("react.responder") : 60118, B = e ? /* @__PURE__ */ Symbol.for("react.scope") : 60119;
    function D(E) {
      return typeof E == "string" || typeof E == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      E === n || E === d || E === a || E === i || E === p || E === m || typeof E == "object" && E !== null && (E.$$typeof === b || E.$$typeof === v || E.$$typeof === c || E.$$typeof === l || E.$$typeof === h || E.$$typeof === C || E.$$typeof === _ || E.$$typeof === B || E.$$typeof === s);
    }
    function $(E) {
      if (typeof E == "object" && E !== null) {
        var ce = E.$$typeof;
        switch (ce) {
          case r:
            var ke = E.type;
            switch (ke) {
              case f:
              case d:
              case n:
              case a:
              case i:
              case p:
                return ke;
              default:
                var gr = ke && ke.$$typeof;
                switch (gr) {
                  case l:
                  case h:
                  case b:
                  case v:
                  case c:
                    return gr;
                  default:
                    return ce;
                }
            }
          case t:
            return ce;
        }
      }
    }
    var y = f, w = d, ae = l, ue = c, J = r, Z = h, X = n, o = b, x = v, S = t, F = a, L = i, ee = p, se = !1;
    function Je(E) {
      return se || (se = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), g(E) || $(E) === f;
    }
    function g(E) {
      return $(E) === d;
    }
    function T(E) {
      return $(E) === l;
    }
    function k(E) {
      return $(E) === c;
    }
    function R(E) {
      return typeof E == "object" && E !== null && E.$$typeof === r;
    }
    function O(E) {
      return $(E) === h;
    }
    function I(E) {
      return $(E) === n;
    }
    function A(E) {
      return $(E) === b;
    }
    function P(E) {
      return $(E) === v;
    }
    function N(E) {
      return $(E) === t;
    }
    function V(E) {
      return $(E) === a;
    }
    function M(E) {
      return $(E) === i;
    }
    function re(E) {
      return $(E) === p;
    }
    W.AsyncMode = y, W.ConcurrentMode = w, W.ContextConsumer = ae, W.ContextProvider = ue, W.Element = J, W.ForwardRef = Z, W.Fragment = X, W.Lazy = o, W.Memo = x, W.Portal = S, W.Profiler = F, W.StrictMode = L, W.Suspense = ee, W.isAsyncMode = Je, W.isConcurrentMode = g, W.isContextConsumer = T, W.isContextProvider = k, W.isElement = R, W.isForwardRef = O, W.isFragment = I, W.isLazy = A, W.isMemo = P, W.isPortal = N, W.isProfiler = V, W.isStrictMode = M, W.isSuspense = re, W.isValidElementType = D, W.typeOf = $;
  })()), W;
}
var br;
function Ur() {
  return br || (br = 1, process.env.NODE_ENV === "production" ? Ne.exports = at() : Ne.exports = st()), Ne.exports;
}
var Ze, vr;
function ct() {
  if (vr) return Ze;
  vr = 1;
  var e = Object.getOwnPropertySymbols, r = Object.prototype.hasOwnProperty, t = Object.prototype.propertyIsEnumerable;
  function n(a) {
    if (a == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(a);
  }
  function i() {
    try {
      if (!Object.assign)
        return !1;
      var a = new String("abc");
      if (a[5] = "de", Object.getOwnPropertyNames(a)[0] === "5")
        return !1;
      for (var c = {}, l = 0; l < 10; l++)
        c["_" + String.fromCharCode(l)] = l;
      var f = Object.getOwnPropertyNames(c).map(function(h) {
        return c[h];
      });
      if (f.join("") !== "0123456789")
        return !1;
      var d = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(h) {
        d[h] = h;
      }), Object.keys(Object.assign({}, d)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Ze = i() ? Object.assign : function(a, c) {
    for (var l, f = n(a), d, h = 1; h < arguments.length; h++) {
      l = Object(arguments[h]);
      for (var p in l)
        r.call(l, p) && (f[p] = l[p]);
      if (e) {
        d = e(l);
        for (var m = 0; m < d.length; m++)
          t.call(l, d[m]) && (f[d[m]] = l[d[m]]);
      }
    }
    return f;
  }, Ze;
}
var er, Sr;
function ur() {
  if (Sr) return er;
  Sr = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return er = e, er;
}
var rr, Cr;
function zr() {
  return Cr || (Cr = 1, rr = Function.call.bind(Object.prototype.hasOwnProperty)), rr;
}
var tr, Er;
function lt() {
  if (Er) return tr;
  Er = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var r = /* @__PURE__ */ ur(), t = {}, n = /* @__PURE__ */ zr();
    e = function(a) {
      var c = "Warning: " + a;
      typeof console < "u" && console.error(c);
      try {
        throw new Error(c);
      } catch {
      }
    };
  }
  function i(a, c, l, f, d) {
    if (process.env.NODE_ENV !== "production") {
      for (var h in a)
        if (n(a, h)) {
          var p;
          try {
            if (typeof a[h] != "function") {
              var m = Error(
                (f || "React class") + ": " + l + " type `" + h + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[h] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw m.name = "Invariant Violation", m;
            }
            p = a[h](c, h, f, l, null, r);
          } catch (b) {
            p = b;
          }
          if (p && !(p instanceof Error) && e(
            (f || "React class") + ": type specification of " + l + " `" + h + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof p + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), p instanceof Error && !(p.message in t)) {
            t[p.message] = !0;
            var v = d ? d() : "";
            e(
              "Failed " + l + " type: " + p.message + (v ?? "")
            );
          }
        }
    }
  }
  return i.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (t = {});
  }, tr = i, tr;
}
var nr, Tr;
function ut() {
  if (Tr) return nr;
  Tr = 1;
  var e = Ur(), r = ct(), t = /* @__PURE__ */ ur(), n = /* @__PURE__ */ zr(), i = /* @__PURE__ */ lt(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(l) {
    var f = "Warning: " + l;
    typeof console < "u" && console.error(f);
    try {
      throw new Error(f);
    } catch {
    }
  });
  function c() {
    return null;
  }
  return nr = function(l, f) {
    var d = typeof Symbol == "function" && Symbol.iterator, h = "@@iterator";
    function p(g) {
      var T = g && (d && g[d] || g[h]);
      if (typeof T == "function")
        return T;
    }
    var m = "<<anonymous>>", v = {
      array: _("array"),
      bigint: _("bigint"),
      bool: _("boolean"),
      func: _("function"),
      number: _("number"),
      object: _("object"),
      string: _("string"),
      symbol: _("symbol"),
      any: B(),
      arrayOf: D,
      element: $(),
      elementType: y(),
      instanceOf: w,
      node: Z(),
      objectOf: ue,
      oneOf: ae,
      oneOfType: J,
      shape: o,
      exact: x
    };
    function b(g, T) {
      return g === T ? g !== 0 || 1 / g === 1 / T : g !== g && T !== T;
    }
    function s(g, T) {
      this.message = g, this.data = T && typeof T == "object" ? T : {}, this.stack = "";
    }
    s.prototype = Error.prototype;
    function C(g) {
      if (process.env.NODE_ENV !== "production")
        var T = {}, k = 0;
      function R(I, A, P, N, V, M, re) {
        if (N = N || m, M = M || P, re !== t) {
          if (f) {
            var E = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw E.name = "Invariant Violation", E;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ce = N + ":" + P;
            !T[ce] && // Avoid spamming the console because they are often not actionable except for lib authors
            k < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + M + "` prop on `" + N + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), T[ce] = !0, k++);
          }
        }
        return A[P] == null ? I ? A[P] === null ? new s("The " + V + " `" + M + "` is marked as required " + ("in `" + N + "`, but its value is `null`.")) : new s("The " + V + " `" + M + "` is marked as required in " + ("`" + N + "`, but its value is `undefined`.")) : null : g(A, P, N, V, M);
      }
      var O = R.bind(null, !1);
      return O.isRequired = R.bind(null, !0), O;
    }
    function _(g) {
      function T(k, R, O, I, A, P) {
        var N = k[R], V = L(N);
        if (V !== g) {
          var M = ee(N);
          return new s(
            "Invalid " + I + " `" + A + "` of type " + ("`" + M + "` supplied to `" + O + "`, expected ") + ("`" + g + "`."),
            { expectedType: g }
          );
        }
        return null;
      }
      return C(T);
    }
    function B() {
      return C(c);
    }
    function D(g) {
      function T(k, R, O, I, A) {
        if (typeof g != "function")
          return new s("Property `" + A + "` of component `" + O + "` has invalid PropType notation inside arrayOf.");
        var P = k[R];
        if (!Array.isArray(P)) {
          var N = L(P);
          return new s("Invalid " + I + " `" + A + "` of type " + ("`" + N + "` supplied to `" + O + "`, expected an array."));
        }
        for (var V = 0; V < P.length; V++) {
          var M = g(P, V, O, I, A + "[" + V + "]", t);
          if (M instanceof Error)
            return M;
        }
        return null;
      }
      return C(T);
    }
    function $() {
      function g(T, k, R, O, I) {
        var A = T[k];
        if (!l(A)) {
          var P = L(A);
          return new s("Invalid " + O + " `" + I + "` of type " + ("`" + P + "` supplied to `" + R + "`, expected a single ReactElement."));
        }
        return null;
      }
      return C(g);
    }
    function y() {
      function g(T, k, R, O, I) {
        var A = T[k];
        if (!e.isValidElementType(A)) {
          var P = L(A);
          return new s("Invalid " + O + " `" + I + "` of type " + ("`" + P + "` supplied to `" + R + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return C(g);
    }
    function w(g) {
      function T(k, R, O, I, A) {
        if (!(k[R] instanceof g)) {
          var P = g.name || m, N = Je(k[R]);
          return new s("Invalid " + I + " `" + A + "` of type " + ("`" + N + "` supplied to `" + O + "`, expected ") + ("instance of `" + P + "`."));
        }
        return null;
      }
      return C(T);
    }
    function ae(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), c;
      function T(k, R, O, I, A) {
        for (var P = k[R], N = 0; N < g.length; N++)
          if (b(P, g[N]))
            return null;
        var V = JSON.stringify(g, function(re, E) {
          var ce = ee(E);
          return ce === "symbol" ? String(E) : E;
        });
        return new s("Invalid " + I + " `" + A + "` of value `" + String(P) + "` " + ("supplied to `" + O + "`, expected one of " + V + "."));
      }
      return C(T);
    }
    function ue(g) {
      function T(k, R, O, I, A) {
        if (typeof g != "function")
          return new s("Property `" + A + "` of component `" + O + "` has invalid PropType notation inside objectOf.");
        var P = k[R], N = L(P);
        if (N !== "object")
          return new s("Invalid " + I + " `" + A + "` of type " + ("`" + N + "` supplied to `" + O + "`, expected an object."));
        for (var V in P)
          if (n(P, V)) {
            var M = g(P, V, O, I, A + "." + V, t);
            if (M instanceof Error)
              return M;
          }
        return null;
      }
      return C(T);
    }
    function J(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), c;
      for (var T = 0; T < g.length; T++) {
        var k = g[T];
        if (typeof k != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + se(k) + " at index " + T + "."
          ), c;
      }
      function R(O, I, A, P, N) {
        for (var V = [], M = 0; M < g.length; M++) {
          var re = g[M], E = re(O, I, A, P, N, t);
          if (E == null)
            return null;
          E.data && n(E.data, "expectedType") && V.push(E.data.expectedType);
        }
        var ce = V.length > 0 ? ", expected one of type [" + V.join(", ") + "]" : "";
        return new s("Invalid " + P + " `" + N + "` supplied to " + ("`" + A + "`" + ce + "."));
      }
      return C(R);
    }
    function Z() {
      function g(T, k, R, O, I) {
        return S(T[k]) ? null : new s("Invalid " + O + " `" + I + "` supplied to " + ("`" + R + "`, expected a ReactNode."));
      }
      return C(g);
    }
    function X(g, T, k, R, O) {
      return new s(
        (g || "React class") + ": " + T + " type `" + k + "." + R + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + O + "`."
      );
    }
    function o(g) {
      function T(k, R, O, I, A) {
        var P = k[R], N = L(P);
        if (N !== "object")
          return new s("Invalid " + I + " `" + A + "` of type `" + N + "` " + ("supplied to `" + O + "`, expected `object`."));
        for (var V in g) {
          var M = g[V];
          if (typeof M != "function")
            return X(O, I, A, V, ee(M));
          var re = M(P, V, O, I, A + "." + V, t);
          if (re)
            return re;
        }
        return null;
      }
      return C(T);
    }
    function x(g) {
      function T(k, R, O, I, A) {
        var P = k[R], N = L(P);
        if (N !== "object")
          return new s("Invalid " + I + " `" + A + "` of type `" + N + "` " + ("supplied to `" + O + "`, expected `object`."));
        var V = r({}, k[R], g);
        for (var M in V) {
          var re = g[M];
          if (n(g, M) && typeof re != "function")
            return X(O, I, A, M, ee(re));
          if (!re)
            return new s(
              "Invalid " + I + " `" + A + "` key `" + M + "` supplied to `" + O + "`.\nBad object: " + JSON.stringify(k[R], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(g), null, "  ")
            );
          var E = re(P, M, O, I, A + "." + M, t);
          if (E)
            return E;
        }
        return null;
      }
      return C(T);
    }
    function S(g) {
      switch (typeof g) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !g;
        case "object":
          if (Array.isArray(g))
            return g.every(S);
          if (g === null || l(g))
            return !0;
          var T = p(g);
          if (T) {
            var k = T.call(g), R;
            if (T !== g.entries) {
              for (; !(R = k.next()).done; )
                if (!S(R.value))
                  return !1;
            } else
              for (; !(R = k.next()).done; ) {
                var O = R.value;
                if (O && !S(O[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function F(g, T) {
      return g === "symbol" ? !0 : T ? T["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && T instanceof Symbol : !1;
    }
    function L(g) {
      var T = typeof g;
      return Array.isArray(g) ? "array" : g instanceof RegExp ? "object" : F(T, g) ? "symbol" : T;
    }
    function ee(g) {
      if (typeof g > "u" || g === null)
        return "" + g;
      var T = L(g);
      if (T === "object") {
        if (g instanceof Date)
          return "date";
        if (g instanceof RegExp)
          return "regexp";
      }
      return T;
    }
    function se(g) {
      var T = ee(g);
      switch (T) {
        case "array":
        case "object":
          return "an " + T;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + T;
        default:
          return T;
      }
    }
    function Je(g) {
      return !g.constructor || !g.constructor.name ? m : g.constructor.name;
    }
    return v.checkPropTypes = i, v.resetWarningCache = i.resetWarningCache, v.PropTypes = v, v;
  }, nr;
}
var or, $r;
function ft() {
  if ($r) return or;
  $r = 1;
  var e = /* @__PURE__ */ ur();
  function r() {
  }
  function t() {
  }
  return t.resetWarningCache = r, or = function() {
    function n(c, l, f, d, h, p) {
      if (p !== e) {
        var m = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw m.name = "Invariant Violation", m;
      }
    }
    n.isRequired = n;
    function i() {
      return n;
    }
    var a = {
      array: n,
      bigint: n,
      bool: n,
      func: n,
      number: n,
      object: n,
      string: n,
      symbol: n,
      any: n,
      arrayOf: i,
      element: n,
      elementType: n,
      instanceOf: i,
      node: n,
      objectOf: i,
      oneOf: i,
      oneOfType: i,
      shape: i,
      exact: i,
      checkPropTypes: t,
      resetWarningCache: r
    };
    return a.PropTypes = a, a;
  }, or;
}
var xr;
function dt() {
  if (xr) return Ie.exports;
  if (xr = 1, process.env.NODE_ENV !== "production") {
    var e = Ur(), r = !0;
    Ie.exports = /* @__PURE__ */ ut()(e.isElement, r);
  } else
    Ie.exports = /* @__PURE__ */ ft()();
  return Ie.exports;
}
var pt = /* @__PURE__ */ dt();
const $e = /* @__PURE__ */ it(pt);
var Me = { exports: {} }, z = {};
var wr;
function mt() {
  if (wr) return z;
  wr = 1;
  var e = /* @__PURE__ */ Symbol.for("react.transitional.element"), r = /* @__PURE__ */ Symbol.for("react.portal"), t = /* @__PURE__ */ Symbol.for("react.fragment"), n = /* @__PURE__ */ Symbol.for("react.strict_mode"), i = /* @__PURE__ */ Symbol.for("react.profiler"), a = /* @__PURE__ */ Symbol.for("react.consumer"), c = /* @__PURE__ */ Symbol.for("react.context"), l = /* @__PURE__ */ Symbol.for("react.forward_ref"), f = /* @__PURE__ */ Symbol.for("react.suspense"), d = /* @__PURE__ */ Symbol.for("react.suspense_list"), h = /* @__PURE__ */ Symbol.for("react.memo"), p = /* @__PURE__ */ Symbol.for("react.lazy"), m = /* @__PURE__ */ Symbol.for("react.view_transition"), v = /* @__PURE__ */ Symbol.for("react.client.reference");
  function b(s) {
    if (typeof s == "object" && s !== null) {
      var C = s.$$typeof;
      switch (C) {
        case e:
          switch (s = s.type, s) {
            case t:
            case i:
            case n:
            case f:
            case d:
            case m:
              return s;
            default:
              switch (s = s && s.$$typeof, s) {
                case c:
                case l:
                case p:
                case h:
                  return s;
                case a:
                  return s;
                default:
                  return C;
              }
          }
        case r:
          return C;
      }
    }
  }
  return z.ContextConsumer = a, z.ContextProvider = c, z.Element = e, z.ForwardRef = l, z.Fragment = t, z.Lazy = p, z.Memo = h, z.Portal = r, z.Profiler = i, z.StrictMode = n, z.Suspense = f, z.SuspenseList = d, z.isContextConsumer = function(s) {
    return b(s) === a;
  }, z.isContextProvider = function(s) {
    return b(s) === c;
  }, z.isElement = function(s) {
    return typeof s == "object" && s !== null && s.$$typeof === e;
  }, z.isForwardRef = function(s) {
    return b(s) === l;
  }, z.isFragment = function(s) {
    return b(s) === t;
  }, z.isLazy = function(s) {
    return b(s) === p;
  }, z.isMemo = function(s) {
    return b(s) === h;
  }, z.isPortal = function(s) {
    return b(s) === r;
  }, z.isProfiler = function(s) {
    return b(s) === i;
  }, z.isStrictMode = function(s) {
    return b(s) === n;
  }, z.isSuspense = function(s) {
    return b(s) === f;
  }, z.isSuspenseList = function(s) {
    return b(s) === d;
  }, z.isValidElementType = function(s) {
    return typeof s == "string" || typeof s == "function" || s === t || s === i || s === n || s === f || s === d || typeof s == "object" && s !== null && (s.$$typeof === p || s.$$typeof === h || s.$$typeof === c || s.$$typeof === a || s.$$typeof === l || s.$$typeof === v || s.getModuleId !== void 0);
  }, z.typeOf = b, z;
}
var H = {};
var Or;
function gt() {
  return Or || (Or = 1, process.env.NODE_ENV !== "production" && (function() {
    function e(s) {
      if (typeof s == "object" && s !== null) {
        var C = s.$$typeof;
        switch (C) {
          case r:
            switch (s = s.type, s) {
              case n:
              case a:
              case i:
              case d:
              case h:
              case v:
                return s;
              default:
                switch (s = s && s.$$typeof, s) {
                  case l:
                  case f:
                  case m:
                  case p:
                    return s;
                  case c:
                    return s;
                  default:
                    return C;
                }
            }
          case t:
            return C;
        }
      }
    }
    var r = /* @__PURE__ */ Symbol.for("react.transitional.element"), t = /* @__PURE__ */ Symbol.for("react.portal"), n = /* @__PURE__ */ Symbol.for("react.fragment"), i = /* @__PURE__ */ Symbol.for("react.strict_mode"), a = /* @__PURE__ */ Symbol.for("react.profiler"), c = /* @__PURE__ */ Symbol.for("react.consumer"), l = /* @__PURE__ */ Symbol.for("react.context"), f = /* @__PURE__ */ Symbol.for("react.forward_ref"), d = /* @__PURE__ */ Symbol.for("react.suspense"), h = /* @__PURE__ */ Symbol.for("react.suspense_list"), p = /* @__PURE__ */ Symbol.for("react.memo"), m = /* @__PURE__ */ Symbol.for("react.lazy"), v = /* @__PURE__ */ Symbol.for("react.view_transition"), b = /* @__PURE__ */ Symbol.for("react.client.reference");
    H.ContextConsumer = c, H.ContextProvider = l, H.Element = r, H.ForwardRef = f, H.Fragment = n, H.Lazy = m, H.Memo = p, H.Portal = t, H.Profiler = a, H.StrictMode = i, H.Suspense = d, H.SuspenseList = h, H.isContextConsumer = function(s) {
      return e(s) === c;
    }, H.isContextProvider = function(s) {
      return e(s) === l;
    }, H.isElement = function(s) {
      return typeof s == "object" && s !== null && s.$$typeof === r;
    }, H.isForwardRef = function(s) {
      return e(s) === f;
    }, H.isFragment = function(s) {
      return e(s) === n;
    }, H.isLazy = function(s) {
      return e(s) === m;
    }, H.isMemo = function(s) {
      return e(s) === p;
    }, H.isPortal = function(s) {
      return e(s) === t;
    }, H.isProfiler = function(s) {
      return e(s) === a;
    }, H.isStrictMode = function(s) {
      return e(s) === i;
    }, H.isSuspense = function(s) {
      return e(s) === d;
    }, H.isSuspenseList = function(s) {
      return e(s) === h;
    }, H.isValidElementType = function(s) {
      return typeof s == "string" || typeof s == "function" || s === n || s === a || s === i || s === d || s === h || typeof s == "object" && s !== null && (s.$$typeof === m || s.$$typeof === p || s.$$typeof === l || s.$$typeof === c || s.$$typeof === f || s.$$typeof === b || s.getModuleId !== void 0);
    }, H.typeOf = e;
  })()), H;
}
var _r;
function ht() {
  return _r || (_r = 1, process.env.NODE_ENV === "production" ? Me.exports = /* @__PURE__ */ mt() : Me.exports = /* @__PURE__ */ gt()), Me.exports;
}
var Hr = /* @__PURE__ */ ht();
function pe(e) {
  if (typeof e != "object" || e === null)
    return !1;
  const r = Object.getPrototypeOf(e);
  return (r === null || r === Object.prototype || Object.getPrototypeOf(r) === null) && !(Symbol.toStringTag in e) && !(Symbol.iterator in e);
}
function qr(e) {
  if (/* @__PURE__ */ Yr.isValidElement(e) || Hr.isValidElementType(e) || !pe(e))
    return e;
  const r = {};
  return Object.keys(e).forEach((t) => {
    r[t] = qr(e[t]);
  }), r;
}
function ne(e, r, t = {
  clone: !0
}) {
  const n = t.clone ? {
    ...e
  } : e;
  return pe(e) && pe(r) && Object.keys(r).forEach((i) => {
    /* @__PURE__ */ Yr.isValidElement(r[i]) || Hr.isValidElementType(r[i]) ? n[i] = r[i] : pe(r[i]) && // Avoid prototype pollution
    Object.prototype.hasOwnProperty.call(e, i) && pe(e[i]) ? n[i] = ne(e[i], r[i], t) : t.clone ? n[i] = pe(r[i]) ? qr(r[i]) : r[i] : n[i] = r[i];
  }), n;
}
const yt = (e) => {
  const r = Object.keys(e).map((t) => ({
    key: t,
    val: e[t]
  })) || [];
  return r.sort((t, n) => t.val - n.val), r.reduce((t, n) => ({
    ...t,
    [n.key]: n.val
  }), {});
};
function bt(e) {
  const {
    // The breakpoint **start** at this value.
    // For instance with the first breakpoint xs: [xs, sm).
    values: r = {
      xs: 0,
      // phone
      sm: 600,
      // tablet
      md: 900,
      // small laptop
      lg: 1200,
      // desktop
      xl: 1536
      // large screen
    },
    unit: t = "px",
    step: n = 5,
    ...i
  } = e, a = yt(r), c = Object.keys(a);
  function l(m) {
    return `@media (min-width:${typeof r[m] == "number" ? r[m] : m}${t})`;
  }
  function f(m) {
    return `@media (max-width:${(typeof r[m] == "number" ? r[m] : m) - n / 100}${t})`;
  }
  function d(m, v) {
    const b = c.indexOf(v);
    return `@media (min-width:${typeof r[m] == "number" ? r[m] : m}${t}) and (max-width:${(b !== -1 && typeof r[c[b]] == "number" ? r[c[b]] : v) - n / 100}${t})`;
  }
  function h(m) {
    return c.indexOf(m) + 1 < c.length ? d(m, c[c.indexOf(m) + 1]) : l(m);
  }
  function p(m) {
    const v = c.indexOf(m);
    return v === 0 ? l(c[1]) : v === c.length - 1 ? f(c[v]) : d(m, c[c.indexOf(m) + 1]).replace("@media", "@media not all and");
  }
  return {
    keys: c,
    values: a,
    up: l,
    down: f,
    between: d,
    only: h,
    not: p,
    unit: t,
    ...i
  };
}
function Ar(e, r) {
  if (!e.containerQueries)
    return r;
  const t = Object.keys(r).filter((n) => n.startsWith("@container")).sort((n, i) => {
    const a = /min-width:\s*([0-9.]+)/;
    return +(n.match(a)?.[1] || 0) - +(i.match(a)?.[1] || 0);
  });
  return t.length ? t.reduce((n, i) => {
    const a = r[i];
    return delete n[i], n[i] = a, n;
  }, {
    ...r
  }) : r;
}
function vt(e, r) {
  return r === "@" || r.startsWith("@") && (e.some((t) => r.startsWith(`@${t}`)) || !!r.match(/^@\d/));
}
function St(e, r) {
  const t = r.match(/^@([^/]+)?\/?(.+)?$/);
  if (!t) {
    if (process.env.NODE_ENV !== "production")
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: The provided shorthand ${`(${r})`} is invalid. The format should be \`@<breakpoint | number>\` or \`@<breakpoint | number>/<container>\`.
For example, \`@sm\` or \`@600\` or \`@40rem/sidebar\`.` : me(18, `(${r})`));
    return null;
  }
  const [, n, i] = t, a = Number.isNaN(+n) ? n || 0 : +n;
  return e.containerQueries(i).up(a);
}
function Ct(e) {
  const r = (a, c) => a.replace("@media", c ? `@container ${c}` : "@container");
  function t(a, c) {
    a.up = (...l) => r(e.breakpoints.up(...l), c), a.down = (...l) => r(e.breakpoints.down(...l), c), a.between = (...l) => r(e.breakpoints.between(...l), c), a.only = (...l) => r(e.breakpoints.only(...l), c), a.not = (...l) => {
      const f = r(e.breakpoints.not(...l), c);
      return f.includes("not all and") ? f.replace("not all and ", "").replace("min-width:", "width<").replace("max-width:", "width>").replace("and", "or") : f;
    };
  }
  const n = {}, i = (a) => (t(n, a), n);
  return t(i), {
    ...e,
    containerQueries: i
  };
}
const Et = {
  borderRadius: 4
}, he = process.env.NODE_ENV !== "production" ? $e.oneOfType([$e.number, $e.string, $e.object, $e.array]) : {};
function _e(e, r) {
  return r ? ne(e, r, {
    clone: !1
    // No need to clone deep, it's way faster.
  }) : e;
}
const Fe = {
  xs: 0,
  // phone
  sm: 600,
  // tablet
  md: 900,
  // small laptop
  lg: 1200,
  // desktop
  xl: 1536
  // large screen
}, Rr = {
  // Sorted ASC by size. That's important.
  // It can't be configured as it's used statically for propTypes.
  keys: ["xs", "sm", "md", "lg", "xl"],
  up: (e) => `@media (min-width:${Fe[e]}px)`
}, Tt = {
  containerQueries: (e) => ({
    up: (r) => {
      let t = typeof r == "number" ? r : Fe[r] || r;
      return typeof t == "number" && (t = `${t}px`), e ? `@container ${e} (min-width:${t})` : `@container (min-width:${t})`;
    }
  })
};
function de(e, r, t) {
  const n = e.theme || {};
  if (Array.isArray(r)) {
    const a = n.breakpoints || Rr;
    return r.reduce((c, l, f) => (c[a.up(a.keys[f])] = t(r[f]), c), {});
  }
  if (typeof r == "object") {
    const a = n.breakpoints || Rr;
    return Object.keys(r).reduce((c, l) => {
      if (vt(a.keys, l)) {
        const f = St(n.containerQueries ? n : Tt, l);
        f && (c[f] = t(r[l], l));
      } else if (Object.keys(a.values || Fe).includes(l)) {
        const f = a.up(l);
        c[f] = t(r[l], l);
      } else {
        const f = l;
        c[f] = r[f];
      }
      return c;
    }, {});
  }
  return t(r);
}
function $t(e = {}) {
  return e.keys?.reduce((t, n) => {
    const i = e.up(n);
    return t[i] = {}, t;
  }, {}) || {};
}
function Pr(e, r) {
  return e.reduce((t, n) => {
    const i = t[n];
    return (!i || Object.keys(i).length === 0) && delete t[n], t;
  }, r);
}
function Gr(e) {
  if (typeof e != "string")
    throw new Error(process.env.NODE_ENV !== "production" ? "MUI: `capitalize(string)` expects a string argument." : me(7));
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function je(e, r, t = !0) {
  if (!r || typeof r != "string")
    return null;
  if (e && e.vars && t) {
    const n = `vars.${r}`.split(".").reduce((i, a) => i && i[a] ? i[a] : null, e);
    if (n != null)
      return n;
  }
  return r.split(".").reduce((n, i) => n && n[i] != null ? n[i] : null, e);
}
function De(e, r, t, n = t) {
  let i;
  return typeof e == "function" ? i = e(t) : Array.isArray(e) ? i = e[t] || n : i = je(e, t) || n, r && (i = r(i, n, e)), i;
}
function Q(e) {
  const {
    prop: r,
    cssProperty: t = e.prop,
    themeKey: n,
    transform: i
  } = e, a = (c) => {
    if (c[r] == null)
      return null;
    const l = c[r], f = c.theme, d = je(f, n) || {};
    return de(c, l, (p) => {
      let m = De(d, i, p);
      return p === m && typeof p == "string" && (m = De(d, i, `${r}${p === "default" ? "" : Gr(p)}`, p)), t === !1 ? m : {
        [t]: m
      };
    });
  };
  return a.propTypes = process.env.NODE_ENV !== "production" ? {
    [r]: he
  } : {}, a.filterProps = [r], a;
}
function xt(e) {
  const r = {};
  return (t) => (r[t] === void 0 && (r[t] = e(t)), r[t]);
}
const wt = {
  m: "margin",
  p: "padding"
}, Ot = {
  t: "Top",
  r: "Right",
  b: "Bottom",
  l: "Left",
  x: ["Left", "Right"],
  y: ["Top", "Bottom"]
}, kr = {
  marginX: "mx",
  marginY: "my",
  paddingX: "px",
  paddingY: "py"
}, _t = xt((e) => {
  if (e.length > 2)
    if (kr[e])
      e = kr[e];
    else
      return [e];
  const [r, t] = e.split(""), n = wt[r], i = Ot[t] || "";
  return Array.isArray(i) ? i.map((a) => n + a) : [n + i];
}), We = ["m", "mt", "mr", "mb", "ml", "mx", "my", "margin", "marginTop", "marginRight", "marginBottom", "marginLeft", "marginX", "marginY", "marginInline", "marginInlineStart", "marginInlineEnd", "marginBlock", "marginBlockStart", "marginBlockEnd"], Le = ["p", "pt", "pr", "pb", "pl", "px", "py", "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "paddingX", "paddingY", "paddingInline", "paddingInlineStart", "paddingInlineEnd", "paddingBlock", "paddingBlockStart", "paddingBlockEnd"], At = [...We, ...Le];
function Re(e, r, t, n) {
  const i = je(e, r, !0) ?? t;
  return typeof i == "number" || typeof i == "string" ? (a) => typeof a == "string" ? a : (process.env.NODE_ENV !== "production" && typeof a != "number" && console.error(`MUI: Expected ${n} argument to be a number or a string, got ${a}.`), typeof i == "string" ? i.startsWith("var(") && a === 0 ? 0 : i.startsWith("var(") && a === 1 ? i : `calc(${a} * ${i})` : i * a) : Array.isArray(i) ? (a) => {
    if (typeof a == "string")
      return a;
    const c = Math.abs(a);
    process.env.NODE_ENV !== "production" && (Number.isInteger(c) ? c > i.length - 1 && console.error([`MUI: The value provided (${c}) overflows.`, `The supported values are: ${JSON.stringify(i)}.`, `${c} > ${i.length - 1}, you need to add the missing values.`].join(`
`)) : console.error([`MUI: The \`theme.${r}\` array type cannot be combined with non integer values.You should either use an integer value that can be used as index, or define the \`theme.${r}\` as a number.`].join(`
`)));
    const l = i[c];
    return a >= 0 ? l : typeof l == "number" ? -l : typeof l == "string" && l.startsWith("var(") ? `calc(-1 * ${l})` : `-${l}`;
  } : typeof i == "function" ? i : (process.env.NODE_ENV !== "production" && console.error([`MUI: The \`theme.${r}\` value (${i}) is invalid.`, "It should be a number, an array or a function."].join(`
`)), () => {
  });
}
function fr(e) {
  return Re(e, "spacing", 8, "spacing");
}
function Pe(e, r) {
  return typeof r == "string" || r == null ? r : e(r);
}
function Rt(e, r) {
  return (t) => e.reduce((n, i) => (n[i] = Pe(r, t), n), {});
}
function Pt(e, r, t, n) {
  if (!r.includes(t))
    return null;
  const i = _t(t), a = Rt(i, n), c = e[t];
  return de(e, c, a);
}
function Kr(e, r) {
  const t = fr(e.theme);
  return Object.keys(e).map((n) => Pt(e, r, n, t)).reduce(_e, {});
}
function G(e) {
  return Kr(e, We);
}
G.propTypes = process.env.NODE_ENV !== "production" ? We.reduce((e, r) => (e[r] = he, e), {}) : {};
G.filterProps = We;
function K(e) {
  return Kr(e, Le);
}
K.propTypes = process.env.NODE_ENV !== "production" ? Le.reduce((e, r) => (e[r] = he, e), {}) : {};
K.filterProps = Le;
process.env.NODE_ENV !== "production" && At.reduce((e, r) => (e[r] = he, e), {});
function Qr(e = 8, r = fr({
  spacing: e
})) {
  if (e.mui)
    return e;
  const t = (...n) => (process.env.NODE_ENV !== "production" && (n.length <= 4 || console.error(`MUI: Too many arguments provided, expected between 0 and 4, got ${n.length}`)), (n.length === 0 ? [1] : n).map((a) => {
    const c = r(a);
    return typeof c == "number" ? `${c}px` : c;
  }).join(" "));
  return t.mui = !0, t;
}
function Ve(...e) {
  const r = e.reduce((n, i) => (i.filterProps.forEach((a) => {
    n[a] = i;
  }), n), {}), t = (n) => Object.keys(n).reduce((i, a) => r[a] ? _e(i, r[a](n)) : i, {});
  return t.propTypes = process.env.NODE_ENV !== "production" ? e.reduce((n, i) => Object.assign(n, i.propTypes), {}) : {}, t.filterProps = e.reduce((n, i) => n.concat(i.filterProps), []), t;
}
function oe(e) {
  return typeof e != "number" ? e : `${e}px solid`;
}
function ie(e, r) {
  return Q({
    prop: e,
    themeKey: "borders",
    transform: r
  });
}
const kt = ie("border", oe), It = ie("borderTop", oe), Nt = ie("borderRight", oe), Mt = ie("borderBottom", oe), Bt = ie("borderLeft", oe), Dt = ie("borderColor"), Ft = ie("borderTopColor"), jt = ie("borderRightColor"), Wt = ie("borderBottomColor"), Lt = ie("borderLeftColor"), Vt = ie("outline", oe), Yt = ie("outlineColor"), Ye = (e) => {
  if (e.borderRadius !== void 0 && e.borderRadius !== null) {
    const r = Re(e.theme, "shape.borderRadius", 4, "borderRadius"), t = (n) => ({
      borderRadius: Pe(r, n)
    });
    return de(e, e.borderRadius, t);
  }
  return null;
};
Ye.propTypes = process.env.NODE_ENV !== "production" ? {
  borderRadius: he
} : {};
Ye.filterProps = ["borderRadius"];
Ve(kt, It, Nt, Mt, Bt, Dt, Ft, jt, Wt, Lt, Ye, Vt, Yt);
const Ue = (e) => {
  if (e.gap !== void 0 && e.gap !== null) {
    const r = Re(e.theme, "spacing", 8, "gap"), t = (n) => ({
      gap: Pe(r, n)
    });
    return de(e, e.gap, t);
  }
  return null;
};
Ue.propTypes = process.env.NODE_ENV !== "production" ? {
  gap: he
} : {};
Ue.filterProps = ["gap"];
const ze = (e) => {
  if (e.columnGap !== void 0 && e.columnGap !== null) {
    const r = Re(e.theme, "spacing", 8, "columnGap"), t = (n) => ({
      columnGap: Pe(r, n)
    });
    return de(e, e.columnGap, t);
  }
  return null;
};
ze.propTypes = process.env.NODE_ENV !== "production" ? {
  columnGap: he
} : {};
ze.filterProps = ["columnGap"];
const He = (e) => {
  if (e.rowGap !== void 0 && e.rowGap !== null) {
    const r = Re(e.theme, "spacing", 8, "rowGap"), t = (n) => ({
      rowGap: Pe(r, n)
    });
    return de(e, e.rowGap, t);
  }
  return null;
};
He.propTypes = process.env.NODE_ENV !== "production" ? {
  rowGap: he
} : {};
He.filterProps = ["rowGap"];
const Ut = Q({
  prop: "gridColumn"
}), zt = Q({
  prop: "gridRow"
}), Ht = Q({
  prop: "gridAutoFlow"
}), qt = Q({
  prop: "gridAutoColumns"
}), Gt = Q({
  prop: "gridAutoRows"
}), Kt = Q({
  prop: "gridTemplateColumns"
}), Qt = Q({
  prop: "gridTemplateRows"
}), Xt = Q({
  prop: "gridTemplateAreas"
}), Jt = Q({
  prop: "gridArea"
});
Ve(Ue, ze, He, Ut, zt, Ht, qt, Gt, Kt, Qt, Xt, Jt);
function Te(e, r) {
  return r === "grey" ? r : e;
}
const Zt = Q({
  prop: "color",
  themeKey: "palette",
  transform: Te
}), en = Q({
  prop: "bgcolor",
  cssProperty: "backgroundColor",
  themeKey: "palette",
  transform: Te
}), rn = Q({
  prop: "backgroundColor",
  themeKey: "palette",
  transform: Te
});
Ve(Zt, en, rn);
function te(e) {
  return e <= 1 && e !== 0 ? `${e * 100}%` : e;
}
const tn = Q({
  prop: "width",
  transform: te
}), dr = (e) => {
  if (e.maxWidth !== void 0 && e.maxWidth !== null) {
    const r = (t) => {
      const n = e.theme?.breakpoints?.values?.[t] || Fe[t];
      return n ? e.theme?.breakpoints?.unit !== "px" ? {
        maxWidth: `${n}${e.theme.breakpoints.unit}`
      } : {
        maxWidth: n
      } : {
        maxWidth: te(t)
      };
    };
    return de(e, e.maxWidth, r);
  }
  return null;
};
dr.filterProps = ["maxWidth"];
const nn = Q({
  prop: "minWidth",
  transform: te
}), on = Q({
  prop: "height",
  transform: te
}), an = Q({
  prop: "maxHeight",
  transform: te
}), sn = Q({
  prop: "minHeight",
  transform: te
});
Q({
  prop: "size",
  cssProperty: "width",
  transform: te
});
Q({
  prop: "size",
  cssProperty: "height",
  transform: te
});
const cn = Q({
  prop: "boxSizing"
});
Ve(tn, dr, nn, on, an, sn, cn);
const qe = {
  // borders
  border: {
    themeKey: "borders",
    transform: oe
  },
  borderTop: {
    themeKey: "borders",
    transform: oe
  },
  borderRight: {
    themeKey: "borders",
    transform: oe
  },
  borderBottom: {
    themeKey: "borders",
    transform: oe
  },
  borderLeft: {
    themeKey: "borders",
    transform: oe
  },
  borderColor: {
    themeKey: "palette"
  },
  borderTopColor: {
    themeKey: "palette"
  },
  borderRightColor: {
    themeKey: "palette"
  },
  borderBottomColor: {
    themeKey: "palette"
  },
  borderLeftColor: {
    themeKey: "palette"
  },
  outline: {
    themeKey: "borders",
    transform: oe
  },
  outlineColor: {
    themeKey: "palette"
  },
  borderRadius: {
    themeKey: "shape.borderRadius",
    style: Ye
  },
  // palette
  color: {
    themeKey: "palette",
    transform: Te
  },
  bgcolor: {
    themeKey: "palette",
    cssProperty: "backgroundColor",
    transform: Te
  },
  backgroundColor: {
    themeKey: "palette",
    transform: Te
  },
  // spacing
  p: {
    style: K
  },
  pt: {
    style: K
  },
  pr: {
    style: K
  },
  pb: {
    style: K
  },
  pl: {
    style: K
  },
  px: {
    style: K
  },
  py: {
    style: K
  },
  padding: {
    style: K
  },
  paddingTop: {
    style: K
  },
  paddingRight: {
    style: K
  },
  paddingBottom: {
    style: K
  },
  paddingLeft: {
    style: K
  },
  paddingX: {
    style: K
  },
  paddingY: {
    style: K
  },
  paddingInline: {
    style: K
  },
  paddingInlineStart: {
    style: K
  },
  paddingInlineEnd: {
    style: K
  },
  paddingBlock: {
    style: K
  },
  paddingBlockStart: {
    style: K
  },
  paddingBlockEnd: {
    style: K
  },
  m: {
    style: G
  },
  mt: {
    style: G
  },
  mr: {
    style: G
  },
  mb: {
    style: G
  },
  ml: {
    style: G
  },
  mx: {
    style: G
  },
  my: {
    style: G
  },
  margin: {
    style: G
  },
  marginTop: {
    style: G
  },
  marginRight: {
    style: G
  },
  marginBottom: {
    style: G
  },
  marginLeft: {
    style: G
  },
  marginX: {
    style: G
  },
  marginY: {
    style: G
  },
  marginInline: {
    style: G
  },
  marginInlineStart: {
    style: G
  },
  marginInlineEnd: {
    style: G
  },
  marginBlock: {
    style: G
  },
  marginBlockStart: {
    style: G
  },
  marginBlockEnd: {
    style: G
  },
  // display
  displayPrint: {
    cssProperty: !1,
    transform: (e) => ({
      "@media print": {
        display: e
      }
    })
  },
  display: {},
  overflow: {},
  textOverflow: {},
  visibility: {},
  whiteSpace: {},
  // flexbox
  flexBasis: {},
  flexDirection: {},
  flexWrap: {},
  justifyContent: {},
  alignItems: {},
  alignContent: {},
  order: {},
  flex: {},
  flexGrow: {},
  flexShrink: {},
  alignSelf: {},
  justifyItems: {},
  justifySelf: {},
  // grid
  gap: {
    style: Ue
  },
  rowGap: {
    style: He
  },
  columnGap: {
    style: ze
  },
  gridColumn: {},
  gridRow: {},
  gridAutoFlow: {},
  gridAutoColumns: {},
  gridAutoRows: {},
  gridTemplateColumns: {},
  gridTemplateRows: {},
  gridTemplateAreas: {},
  gridArea: {},
  // positions
  position: {},
  zIndex: {
    themeKey: "zIndex"
  },
  top: {},
  right: {},
  bottom: {},
  left: {},
  // shadows
  boxShadow: {
    themeKey: "shadows"
  },
  // sizing
  width: {
    transform: te
  },
  maxWidth: {
    style: dr
  },
  minWidth: {
    transform: te
  },
  height: {
    transform: te
  },
  maxHeight: {
    transform: te
  },
  minHeight: {
    transform: te
  },
  boxSizing: {},
  // typography
  font: {
    themeKey: "font"
  },
  fontFamily: {
    themeKey: "typography"
  },
  fontSize: {
    themeKey: "typography"
  },
  fontStyle: {
    themeKey: "typography"
  },
  fontWeight: {
    themeKey: "typography"
  },
  letterSpacing: {},
  textTransform: {},
  lineHeight: {},
  textAlign: {},
  typography: {
    cssProperty: !1,
    themeKey: "typography"
  }
};
function ln(...e) {
  const r = e.reduce((n, i) => n.concat(Object.keys(i)), []), t = new Set(r);
  return e.every((n) => t.size === Object.keys(n).length);
}
function un(e, r) {
  return typeof e == "function" ? e(r) : e;
}
function fn() {
  function e(t, n, i, a) {
    const c = {
      [t]: n,
      theme: i
    }, l = a[t];
    if (!l)
      return {
        [t]: n
      };
    const {
      cssProperty: f = t,
      themeKey: d,
      transform: h,
      style: p
    } = l;
    if (n == null)
      return null;
    if (d === "typography" && n === "inherit")
      return {
        [t]: n
      };
    const m = je(i, d) || {};
    return p ? p(c) : de(c, n, (b) => {
      let s = De(m, h, b);
      return b === s && typeof b == "string" && (s = De(m, h, `${t}${b === "default" ? "" : Gr(b)}`, b)), f === !1 ? s : {
        [f]: s
      };
    });
  }
  function r(t) {
    const {
      sx: n,
      theme: i = {},
      nested: a
    } = t || {};
    if (!n)
      return null;
    const c = i.unstable_sxConfig ?? qe;
    function l(f) {
      let d = f;
      if (typeof f == "function")
        d = f(i);
      else if (typeof f != "object")
        return f;
      if (!d)
        return null;
      const h = $t(i.breakpoints), p = Object.keys(h);
      let m = h;
      return Object.keys(d).forEach((v) => {
        const b = un(d[v], i);
        if (b != null)
          if (typeof b == "object")
            if (c[v])
              m = _e(m, e(v, b, i, c));
            else {
              const s = de({
                theme: i
              }, b, (C) => ({
                [v]: C
              }));
              ln(s, b) ? m[v] = r({
                sx: b,
                theme: i,
                nested: !0
              }) : m = _e(m, s);
            }
          else
            m = _e(m, e(v, b, i, c));
      }), !a && i.modularCssLayers ? {
        "@layer sx": Ar(i, Pr(p, m))
      } : Ar(i, Pr(p, m));
    }
    return Array.isArray(n) ? n.map(l) : l(n);
  }
  return r;
}
const Ge = fn();
Ge.filterProps = ["sx"];
function dn(e, r) {
  const t = this;
  if (t.vars) {
    if (!t.colorSchemes?.[e] || typeof t.getColorSchemeSelector != "function")
      return {};
    let n = t.getColorSchemeSelector(e);
    return n === "&" ? r : ((n.includes("data-") || n.includes(".")) && (n = `*:where(${n.replace(/\s*&$/, "")}) &`), {
      [n]: r
    });
  }
  return t.palette.mode === e ? r : {};
}
function pn(e = {}, ...r) {
  const {
    breakpoints: t = {},
    palette: n = {},
    spacing: i,
    shape: a = {},
    ...c
  } = e, l = bt(t), f = Qr(i);
  let d = ne({
    breakpoints: l,
    direction: "ltr",
    components: {},
    // Inject component definitions.
    palette: {
      mode: "light",
      ...n
    },
    spacing: f,
    shape: {
      ...Et,
      ...a
    }
  }, c);
  return d = Ct(d), d.applyStyles = dn, d = r.reduce((h, p) => ne(h, p), d), d.unstable_sxConfig = {
    ...qe,
    ...c?.unstable_sxConfig
  }, d.unstable_sx = function(p) {
    return Ge({
      sx: p,
      theme: this
    });
  }, d;
}
const Ir = (e) => e, mn = () => {
  let e = Ir;
  return {
    configure(r) {
      e = r;
    },
    generate(r) {
      return e(r);
    },
    reset() {
      e = Ir;
    }
  };
}, gn = mn(), hn = {
  active: "active",
  checked: "checked",
  completed: "completed",
  disabled: "disabled",
  error: "error",
  expanded: "expanded",
  focused: "focused",
  focusVisible: "focusVisible",
  open: "open",
  readOnly: "readOnly",
  required: "required",
  selected: "selected"
};
function yn(e, r, t = "Mui") {
  const n = hn[r];
  return n ? `${t}-${n}` : `${gn.generate(e)}-${r}`;
}
function bn(e, r = Number.MIN_SAFE_INTEGER, t = Number.MAX_SAFE_INTEGER) {
  return Math.max(r, Math.min(e, t));
}
function pr(e, r = 0, t = 1) {
  return process.env.NODE_ENV !== "production" && (e < r || e > t) && console.error(`MUI: The value provided ${e} is out of range [${r}, ${t}].`), bn(e, r, t);
}
function vn(e) {
  e = e.slice(1);
  const r = new RegExp(`.{1,${e.length >= 6 ? 2 : 1}}`, "g");
  let t = e.match(r);
  return t && t[0].length === 1 && (t = t.map((n) => n + n)), process.env.NODE_ENV !== "production" && e.length !== e.trim().length && console.error(`MUI: The color: "${e}" is invalid. Make sure the color input doesn't contain leading/trailing space.`), t ? `rgb${t.length === 4 ? "a" : ""}(${t.map((n, i) => i < 3 ? parseInt(n, 16) : Math.round(parseInt(n, 16) / 255 * 1e3) / 1e3).join(", ")})` : "";
}
function ge(e) {
  if (e.type)
    return e;
  if (e.charAt(0) === "#")
    return ge(vn(e));
  const r = e.indexOf("("), t = e.substring(0, r);
  if (!["rgb", "rgba", "hsl", "hsla", "color"].includes(t))
    throw new Error(process.env.NODE_ENV !== "production" ? `MUI: Unsupported \`${e}\` color.
The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color().` : me(9, e));
  let n = e.substring(r + 1, e.length - 1), i;
  if (t === "color") {
    if (n = n.split(" "), i = n.shift(), n.length === 4 && n[3].charAt(0) === "/" && (n[3] = n[3].slice(1)), !["srgb", "display-p3", "a98-rgb", "prophoto-rgb", "rec-2020"].includes(i))
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: unsupported \`${i}\` color space.
The following color spaces are supported: srgb, display-p3, a98-rgb, prophoto-rgb, rec-2020.` : me(10, i));
  } else
    n = n.split(",");
  return n = n.map((a) => parseFloat(a)), {
    type: t,
    values: n,
    colorSpace: i
  };
}
const Sn = (e) => {
  const r = ge(e);
  return r.values.slice(0, 3).map((t, n) => r.type.includes("hsl") && n !== 0 ? `${t}%` : t).join(" ");
}, we = (e, r) => {
  try {
    return Sn(e);
  } catch {
    return r && process.env.NODE_ENV !== "production" && console.warn(r), e;
  }
};
function Ke(e) {
  const {
    type: r,
    colorSpace: t
  } = e;
  let {
    values: n
  } = e;
  return r.includes("rgb") ? n = n.map((i, a) => a < 3 ? parseInt(i, 10) : i) : r.includes("hsl") && (n[1] = `${n[1]}%`, n[2] = `${n[2]}%`), r.includes("color") ? n = `${t} ${n.join(" ")}` : n = `${n.join(", ")}`, `${r}(${n})`;
}
function Xr(e) {
  e = ge(e);
  const {
    values: r
  } = e, t = r[0], n = r[1] / 100, i = r[2] / 100, a = n * Math.min(i, 1 - i), c = (d, h = (d + t / 30) % 12) => i - a * Math.max(Math.min(h - 3, 9 - h, 1), -1);
  let l = "rgb";
  const f = [Math.round(c(0) * 255), Math.round(c(8) * 255), Math.round(c(4) * 255)];
  return e.type === "hsla" && (l += "a", f.push(r[3])), Ke({
    type: l,
    values: f
  });
}
function sr(e) {
  e = ge(e);
  let r = e.type === "hsl" || e.type === "hsla" ? ge(Xr(e)).values : e.values;
  return r = r.map((t) => (e.type !== "color" && (t /= 255), t <= 0.03928 ? t / 12.92 : ((t + 0.055) / 1.055) ** 2.4)), Number((0.2126 * r[0] + 0.7152 * r[1] + 0.0722 * r[2]).toFixed(3));
}
function Nr(e, r) {
  const t = sr(e), n = sr(r);
  return (Math.max(t, n) + 0.05) / (Math.min(t, n) + 0.05);
}
function Jr(e, r) {
  return e = ge(e), r = pr(r), (e.type === "rgb" || e.type === "hsl") && (e.type += "a"), e.type === "color" ? e.values[3] = `/${r}` : e.values[3] = r, Ke(e);
}
function ye(e, r, t) {
  try {
    return Jr(e, r);
  } catch {
    return t && process.env.NODE_ENV !== "production" && console.warn(t), e;
  }
}
function Qe(e, r) {
  if (e = ge(e), r = pr(r), e.type.includes("hsl"))
    e.values[2] *= 1 - r;
  else if (e.type.includes("rgb") || e.type.includes("color"))
    for (let t = 0; t < 3; t += 1)
      e.values[t] *= 1 - r;
  return Ke(e);
}
function Y(e, r, t) {
  try {
    return Qe(e, r);
  } catch {
    return t && process.env.NODE_ENV !== "production" && console.warn(t), e;
  }
}
function Xe(e, r) {
  if (e = ge(e), r = pr(r), e.type.includes("hsl"))
    e.values[2] += (100 - e.values[2]) * r;
  else if (e.type.includes("rgb"))
    for (let t = 0; t < 3; t += 1)
      e.values[t] += (255 - e.values[t]) * r;
  else if (e.type.includes("color"))
    for (let t = 0; t < 3; t += 1)
      e.values[t] += (1 - e.values[t]) * r;
  return Ke(e);
}
function U(e, r, t) {
  try {
    return Xe(e, r);
  } catch {
    return t && process.env.NODE_ENV !== "production" && console.warn(t), e;
  }
}
function Cn(e, r = 0.15) {
  return sr(e) > 0.5 ? Qe(e, r) : Xe(e, r);
}
function Be(e, r, t) {
  try {
    return Cn(e, r);
  } catch {
    return e;
  }
}
function En(e = "") {
  function r(...n) {
    if (!n.length)
      return "";
    const i = n[0];
    return typeof i == "string" && !i.match(/(#|\(|\)|(-?(\d*\.)?\d+)(px|em|%|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc))|^(-?(\d*\.)?\d+)$|(\d+ \d+ \d+)/) ? `, var(--${e ? `${e}-` : ""}${i}${r(...n.slice(1))})` : `, ${i}`;
  }
  return (n, ...i) => `var(--${e ? `${e}-` : ""}${n}${r(...i)})`;
}
const Mr = (e, r, t, n = []) => {
  let i = e;
  r.forEach((a, c) => {
    c === r.length - 1 ? Array.isArray(i) ? i[Number(a)] = t : i && typeof i == "object" && (i[a] = t) : i && typeof i == "object" && (i[a] || (i[a] = n.includes(a) ? [] : {}), i = i[a]);
  });
}, Tn = (e, r, t) => {
  function n(i, a = [], c = []) {
    Object.entries(i).forEach(([l, f]) => {
      (!t || t && !t([...a, l])) && f != null && (typeof f == "object" && Object.keys(f).length > 0 ? n(f, [...a, l], Array.isArray(f) ? [...c, l] : c) : r([...a, l], f, c));
    });
  }
  n(e);
}, $n = (e, r) => typeof r == "number" ? ["lineHeight", "fontWeight", "opacity", "zIndex"].some((n) => e.includes(n)) || e[e.length - 1].toLowerCase().includes("opacity") ? r : `${r}px` : r;
function ir(e, r) {
  const {
    prefix: t,
    shouldSkipGeneratingVar: n
  } = r || {}, i = {}, a = {}, c = {};
  return Tn(
    e,
    (l, f, d) => {
      if ((typeof f == "string" || typeof f == "number") && (!n || !n(l, f))) {
        const h = `--${t ? `${t}-` : ""}${l.join("-")}`, p = $n(l, f);
        Object.assign(i, {
          [h]: p
        }), Mr(a, l, `var(${h})`, d), Mr(c, l, `var(${h}, ${p})`, d);
      }
    },
    (l) => l[0] === "vars"
    // skip 'vars/*' paths
  ), {
    css: i,
    vars: a,
    varsWithDefaults: c
  };
}
function xn(e, r = {}) {
  const {
    getSelector: t = _,
    disableCssColorScheme: n,
    colorSchemeSelector: i,
    enableContrastVars: a
  } = r, {
    colorSchemes: c = {},
    components: l,
    defaultColorScheme: f = "light",
    ...d
  } = e, {
    vars: h,
    css: p,
    varsWithDefaults: m
  } = ir(d, r);
  let v = m;
  const b = {}, {
    [f]: s,
    ...C
  } = c;
  if (Object.entries(C || {}).forEach(([$, y]) => {
    const {
      vars: w,
      css: ae,
      varsWithDefaults: ue
    } = ir(y, r);
    v = ne(v, ue), b[$] = {
      css: ae,
      vars: w
    };
  }), s) {
    const {
      css: $,
      vars: y,
      varsWithDefaults: w
    } = ir(s, r);
    v = ne(v, w), b[f] = {
      css: $,
      vars: y
    };
  }
  function _($, y) {
    let w = i;
    if (i === "class" && (w = ".%s"), i === "data" && (w = "[data-%s]"), i?.startsWith("data-") && !i.includes("%s") && (w = `[${i}="%s"]`), $) {
      if (w === "media")
        return e.defaultColorScheme === $ ? ":root" : {
          [`@media (prefers-color-scheme: ${c[$]?.palette?.mode || $})`]: {
            ":root": y
          }
        };
      if (w)
        return e.defaultColorScheme === $ ? `:root, ${w.replace("%s", String($))}` : w.replace("%s", String($));
    }
    return ":root";
  }
  return {
    vars: v,
    generateThemeVars: () => {
      let $ = {
        ...h
      };
      return Object.entries(b).forEach(([, {
        vars: y
      }]) => {
        $ = ne($, y);
      }), $;
    },
    generateStyleSheets: () => {
      const $ = [], y = e.defaultColorScheme || "light";
      function w(J, Z) {
        Object.keys(Z).length && $.push(typeof J == "string" ? {
          [J]: {
            ...Z
          }
        } : J);
      }
      w(t(void 0, {
        ...p
      }), p);
      const {
        [y]: ae,
        ...ue
      } = b;
      if (ae) {
        const {
          css: J
        } = ae, Z = c[y]?.palette?.mode, X = !n && Z ? {
          colorScheme: Z,
          ...J
        } : {
          ...J
        };
        w(t(y, {
          ...X
        }), X);
      }
      return Object.entries(ue).forEach(([J, {
        css: Z
      }]) => {
        const X = c[J]?.palette?.mode, o = !n && X ? {
          colorScheme: X,
          ...Z
        } : {
          ...Z
        };
        w(t(J, {
          ...o
        }), o);
      }), a && $.push({
        ":root": {
          // use double underscore to indicate that these are private variables
          "--__l-threshold": "0.7",
          "--__l": "clamp(0, (l / var(--__l-threshold) - 1) * -infinity, 1)",
          "--__a": "clamp(0.87, (l / var(--__l-threshold) - 1) * -infinity, 1)"
          // 0.87 is the default alpha value for black text.
        }
      }), $;
    }
  };
}
function wn(e) {
  return function(t) {
    return e === "media" ? (process.env.NODE_ENV !== "production" && t !== "light" && t !== "dark" && console.error(`MUI: @media (prefers-color-scheme) supports only 'light' or 'dark', but receive '${t}'.`), `@media (prefers-color-scheme: ${t})`) : e ? e.startsWith("data-") && !e.includes("%s") ? `[${e}="${t}"] &` : e === "class" ? `.${t} &` : e === "data" ? `[data-${t}] &` : `${e.replace("%s", t)} &` : "&";
  };
}
const Ae = {
  black: "#000",
  white: "#fff"
}, On = {
  50: "#fafafa",
  100: "#f5f5f5",
  200: "#eeeeee",
  300: "#e0e0e0",
  400: "#bdbdbd",
  500: "#9e9e9e",
  600: "#757575",
  700: "#616161",
  800: "#424242",
  900: "#212121",
  A100: "#f5f5f5",
  A200: "#eeeeee",
  A400: "#bdbdbd",
  A700: "#616161"
}, be = {
  50: "#f3e5f5",
  200: "#ce93d8",
  300: "#ba68c8",
  400: "#ab47bc",
  500: "#9c27b0",
  700: "#7b1fa2"
}, ve = {
  300: "#e57373",
  400: "#ef5350",
  500: "#f44336",
  700: "#d32f2f",
  800: "#c62828"
}, xe = {
  300: "#ffb74d",
  400: "#ffa726",
  500: "#ff9800",
  700: "#f57c00",
  900: "#e65100"
}, Se = {
  50: "#e3f2fd",
  200: "#90caf9",
  400: "#42a5f5",
  700: "#1976d2",
  800: "#1565c0"
}, Ce = {
  300: "#4fc3f7",
  400: "#29b6f6",
  500: "#03a9f4",
  700: "#0288d1",
  900: "#01579b"
}, Ee = {
  300: "#81c784",
  400: "#66bb6a",
  500: "#4caf50",
  700: "#388e3c",
  800: "#2e7d32",
  900: "#1b5e20"
};
function Zr() {
  return {
    // The colors used to style the text.
    text: {
      // The most important text.
      primary: "rgba(0, 0, 0, 0.87)",
      // Secondary text.
      secondary: "rgba(0, 0, 0, 0.6)",
      // Disabled text have even lower visual prominence.
      disabled: "rgba(0, 0, 0, 0.38)"
    },
    // The color used to divide different elements.
    divider: "rgba(0, 0, 0, 0.12)",
    // The background colors used to style the surfaces.
    // Consistency between these values is important.
    background: {
      paper: Ae.white,
      default: Ae.white
    },
    // The colors used to style the action elements.
    action: {
      // The color of an active action like an icon button.
      active: "rgba(0, 0, 0, 0.54)",
      // The color of an hovered action.
      hover: "rgba(0, 0, 0, 0.04)",
      hoverOpacity: 0.04,
      // The color of a selected action.
      selected: "rgba(0, 0, 0, 0.08)",
      selectedOpacity: 0.08,
      // The color of a disabled action.
      disabled: "rgba(0, 0, 0, 0.26)",
      // The background color of a disabled action.
      disabledBackground: "rgba(0, 0, 0, 0.12)",
      disabledOpacity: 0.38,
      focus: "rgba(0, 0, 0, 0.12)",
      focusOpacity: 0.12,
      activatedOpacity: 0.12
    }
  };
}
const et = Zr();
function rt() {
  return {
    text: {
      primary: Ae.white,
      secondary: "rgba(255, 255, 255, 0.7)",
      disabled: "rgba(255, 255, 255, 0.5)",
      icon: "rgba(255, 255, 255, 0.5)"
    },
    divider: "rgba(255, 255, 255, 0.12)",
    background: {
      paper: "#121212",
      default: "#121212"
    },
    action: {
      active: Ae.white,
      hover: "rgba(255, 255, 255, 0.08)",
      hoverOpacity: 0.08,
      selected: "rgba(255, 255, 255, 0.16)",
      selectedOpacity: 0.16,
      disabled: "rgba(255, 255, 255, 0.3)",
      disabledBackground: "rgba(255, 255, 255, 0.12)",
      disabledOpacity: 0.38,
      focus: "rgba(255, 255, 255, 0.12)",
      focusOpacity: 0.12,
      activatedOpacity: 0.24
    }
  };
}
const cr = rt();
function Br(e, r, t, n) {
  const i = n.light || n, a = n.dark || n * 1.5;
  e[r] || (e.hasOwnProperty(t) ? e[r] = e[t] : r === "light" ? e.light = Xe(e.main, i) : r === "dark" && (e.dark = Qe(e.main, a)));
}
function Dr(e, r, t, n, i) {
  const a = i.light || i, c = i.dark || i * 1.5;
  r[t] || (r.hasOwnProperty(n) ? r[t] = r[n] : t === "light" ? r.light = `color-mix(in ${e}, ${r.main}, #fff ${(a * 100).toFixed(0)}%)` : t === "dark" && (r.dark = `color-mix(in ${e}, ${r.main}, #000 ${(c * 100).toFixed(0)}%)`));
}
function _n(e = "light") {
  return e === "dark" ? {
    main: Se[200],
    light: Se[50],
    dark: Se[400]
  } : {
    main: Se[700],
    light: Se[400],
    dark: Se[800]
  };
}
function An(e = "light") {
  return e === "dark" ? {
    main: be[200],
    light: be[50],
    dark: be[400]
  } : {
    main: be[500],
    light: be[300],
    dark: be[700]
  };
}
function Rn(e = "light") {
  return e === "dark" ? {
    main: ve[500],
    light: ve[300],
    dark: ve[700]
  } : {
    main: ve[700],
    light: ve[400],
    dark: ve[800]
  };
}
function Pn(e = "light") {
  return e === "dark" ? {
    main: Ce[400],
    light: Ce[300],
    dark: Ce[700]
  } : {
    main: Ce[700],
    light: Ce[500],
    dark: Ce[900]
  };
}
function kn(e = "light") {
  return e === "dark" ? {
    main: Ee[400],
    light: Ee[300],
    dark: Ee[700]
  } : {
    main: Ee[800],
    light: Ee[500],
    dark: Ee[900]
  };
}
function In(e = "light") {
  return e === "dark" ? {
    main: xe[400],
    light: xe[300],
    dark: xe[700]
  } : {
    main: "#ed6c02",
    // closest to orange[800] that pass 3:1.
    light: xe[500],
    dark: xe[900]
  };
}
function Nn(e) {
  return `oklch(from ${e} var(--__l) 0 h / var(--__a))`;
}
function mr(e) {
  const {
    mode: r = "light",
    contrastThreshold: t = 3,
    tonalOffset: n = 0.2,
    colorSpace: i,
    ...a
  } = e, c = e.primary || _n(r), l = e.secondary || An(r), f = e.error || Rn(r), d = e.info || Pn(r), h = e.success || kn(r), p = e.warning || In(r);
  function m(C) {
    if (i)
      return Nn(C);
    const _ = Nr(C, cr.text.primary) >= t ? cr.text.primary : et.text.primary;
    if (process.env.NODE_ENV !== "production") {
      const B = Nr(C, _);
      B < 3 && console.error([`MUI: The contrast ratio of ${B}:1 for ${_} on ${C}`, "falls below the WCAG recommended absolute minimum contrast ratio of 3:1.", "https://www.w3.org/TR/2008/REC-WCAG20-20081211/#visual-audio-contrast-contrast"].join(`
`));
    }
    return _;
  }
  const v = ({
    color: C,
    name: _,
    mainShade: B = 500,
    lightShade: D = 300,
    darkShade: $ = 700
  }) => {
    if (C = {
      ...C
    }, !C.main && C[B] && (C.main = C[B]), !C.hasOwnProperty("main"))
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: The color${_ ? ` (${_})` : ""} provided to augmentColor(color) is invalid.
The color object needs to have a \`main\` property or a \`${B}\` property.` : me(11, _ ? ` (${_})` : "", B));
    if (typeof C.main != "string")
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: The color${_ ? ` (${_})` : ""} provided to augmentColor(color) is invalid.
\`color.main\` should be a string, but \`${JSON.stringify(C.main)}\` was provided instead.

Did you intend to use one of the following approaches?

import { green } from "@mui/material/colors";

const theme1 = createTheme({ palette: {
  primary: green,
} });

const theme2 = createTheme({ palette: {
  primary: { main: green[500] },
} });` : me(12, _ ? ` (${_})` : "", JSON.stringify(C.main)));
    return i ? (Dr(i, C, "light", D, n), Dr(i, C, "dark", $, n)) : (Br(C, "light", D, n), Br(C, "dark", $, n)), C.contrastText || (C.contrastText = m(C.main)), C;
  };
  let b;
  return r === "light" ? b = Zr() : r === "dark" && (b = rt()), process.env.NODE_ENV !== "production" && (b || console.error(`MUI: The palette mode \`${r}\` is not supported.`)), ne({
    // A collection of common colors.
    common: {
      ...Ae
    },
    // prevent mutable object.
    // The palette mode, can be light or dark.
    mode: r,
    // The colors used to represent primary interface elements for a user.
    primary: v({
      color: c,
      name: "primary"
    }),
    // The colors used to represent secondary interface elements for a user.
    secondary: v({
      color: l,
      name: "secondary",
      mainShade: "A400",
      lightShade: "A200",
      darkShade: "A700"
    }),
    // The colors used to represent interface elements that the user should be made aware of.
    error: v({
      color: f,
      name: "error"
    }),
    // The colors used to represent potentially dangerous actions or important messages.
    warning: v({
      color: p,
      name: "warning"
    }),
    // The colors used to present information to the user that is neutral and not necessarily important.
    info: v({
      color: d,
      name: "info"
    }),
    // The colors used to indicate the successful completion of an action that user triggered.
    success: v({
      color: h,
      name: "success"
    }),
    // The grey colors.
    grey: On,
    // Used by `getContrastText()` to maximize the contrast between
    // the background and the text.
    contrastThreshold: t,
    // Takes a background color and returns the text color that maximizes the contrast.
    getContrastText: m,
    // Generate a rich color object.
    augmentColor: v,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset: n,
    // The light and dark mode object.
    ...b
  }, a);
}
function Mn(e) {
  const r = {};
  return Object.entries(e).forEach((n) => {
    const [i, a] = n;
    typeof a == "object" && (r[i] = `${a.fontStyle ? `${a.fontStyle} ` : ""}${a.fontVariant ? `${a.fontVariant} ` : ""}${a.fontWeight ? `${a.fontWeight} ` : ""}${a.fontStretch ? `${a.fontStretch} ` : ""}${a.fontSize || ""}${a.lineHeight ? `/${a.lineHeight} ` : ""}${a.fontFamily || ""}`);
  }), r;
}
function Bn(e, r) {
  return {
    toolbar: {
      minHeight: 56,
      [e.up("xs")]: {
        "@media (orientation: landscape)": {
          minHeight: 48
        }
      },
      [e.up("sm")]: {
        minHeight: 64
      }
    },
    ...r
  };
}
function Dn(e) {
  return Math.round(e * 1e5) / 1e5;
}
const Fr = {
  textTransform: "uppercase"
}, jr = '"Roboto", "Helvetica", "Arial", sans-serif';
function Fn(e, r) {
  const {
    fontFamily: t = jr,
    // The default font size of the Material Specification.
    fontSize: n = 14,
    // px
    fontWeightLight: i = 300,
    fontWeightRegular: a = 400,
    fontWeightMedium: c = 500,
    fontWeightBold: l = 700,
    // Tell MUI what's the font-size on the html element.
    // 16px is the default font-size used by browsers.
    htmlFontSize: f = 16,
    // Apply the CSS properties to all the variants.
    allVariants: d,
    pxToRem: h,
    ...p
  } = typeof r == "function" ? r(e) : r;
  process.env.NODE_ENV !== "production" && (typeof n != "number" && console.error("MUI: `fontSize` is required to be a number."), typeof f != "number" && console.error("MUI: `htmlFontSize` is required to be a number."));
  const m = n / 14, v = h || ((C) => `${C / f * m}rem`), b = (C, _, B, D, $) => ({
    fontFamily: t,
    fontWeight: C,
    fontSize: v(_),
    // Unitless following https://meyerweb.com/eric/thoughts/2006/02/08/unitless-line-heights/
    lineHeight: B,
    // The letter spacing was designed for the Roboto font-family. Using the same letter-spacing
    // across font-families can cause issues with the kerning.
    ...t === jr ? {
      letterSpacing: `${Dn(D / _)}em`
    } : {},
    ...$,
    ...d
  }), s = {
    h1: b(i, 96, 1.167, -1.5),
    h2: b(i, 60, 1.2, -0.5),
    h3: b(a, 48, 1.167, 0),
    h4: b(a, 34, 1.235, 0.25),
    h5: b(a, 24, 1.334, 0),
    h6: b(c, 20, 1.6, 0.15),
    subtitle1: b(a, 16, 1.75, 0.15),
    subtitle2: b(c, 14, 1.57, 0.1),
    body1: b(a, 16, 1.5, 0.15),
    body2: b(a, 14, 1.43, 0.15),
    button: b(c, 14, 1.75, 0.4, Fr),
    caption: b(a, 12, 1.66, 0.4),
    overline: b(a, 12, 2.66, 1, Fr),
    // TODO v6: Remove handling of 'inherit' variant from the theme as it is already handled in Material UI's Typography component. Also, remember to remove the associated types.
    inherit: {
      fontFamily: "inherit",
      fontWeight: "inherit",
      fontSize: "inherit",
      lineHeight: "inherit",
      letterSpacing: "inherit"
    }
  };
  return ne({
    htmlFontSize: f,
    pxToRem: v,
    fontFamily: t,
    fontSize: n,
    fontWeightLight: i,
    fontWeightRegular: a,
    fontWeightMedium: c,
    fontWeightBold: l,
    ...s
  }, p, {
    clone: !1
    // No need to clone deep
  });
}
const jn = 0.2, Wn = 0.14, Ln = 0.12;
function q(...e) {
  return [`${e[0]}px ${e[1]}px ${e[2]}px ${e[3]}px rgba(0,0,0,${jn})`, `${e[4]}px ${e[5]}px ${e[6]}px ${e[7]}px rgba(0,0,0,${Wn})`, `${e[8]}px ${e[9]}px ${e[10]}px ${e[11]}px rgba(0,0,0,${Ln})`].join(",");
}
const Vn = ["none", q(0, 2, 1, -1, 0, 1, 1, 0, 0, 1, 3, 0), q(0, 3, 1, -2, 0, 2, 2, 0, 0, 1, 5, 0), q(0, 3, 3, -2, 0, 3, 4, 0, 0, 1, 8, 0), q(0, 2, 4, -1, 0, 4, 5, 0, 0, 1, 10, 0), q(0, 3, 5, -1, 0, 5, 8, 0, 0, 1, 14, 0), q(0, 3, 5, -1, 0, 6, 10, 0, 0, 1, 18, 0), q(0, 4, 5, -2, 0, 7, 10, 1, 0, 2, 16, 1), q(0, 5, 5, -3, 0, 8, 10, 1, 0, 3, 14, 2), q(0, 5, 6, -3, 0, 9, 12, 1, 0, 3, 16, 2), q(0, 6, 6, -3, 0, 10, 14, 1, 0, 4, 18, 3), q(0, 6, 7, -4, 0, 11, 15, 1, 0, 4, 20, 3), q(0, 7, 8, -4, 0, 12, 17, 2, 0, 5, 22, 4), q(0, 7, 8, -4, 0, 13, 19, 2, 0, 5, 24, 4), q(0, 7, 9, -4, 0, 14, 21, 2, 0, 5, 26, 4), q(0, 8, 9, -5, 0, 15, 22, 2, 0, 6, 28, 5), q(0, 8, 10, -5, 0, 16, 24, 2, 0, 6, 30, 5), q(0, 8, 11, -5, 0, 17, 26, 2, 0, 6, 32, 5), q(0, 9, 11, -5, 0, 18, 28, 2, 0, 7, 34, 6), q(0, 9, 12, -6, 0, 19, 29, 2, 0, 7, 36, 6), q(0, 10, 13, -6, 0, 20, 31, 3, 0, 8, 38, 7), q(0, 10, 13, -6, 0, 21, 33, 3, 0, 8, 40, 7), q(0, 10, 14, -6, 0, 22, 35, 3, 0, 8, 42, 7), q(0, 11, 14, -7, 0, 23, 36, 3, 0, 9, 44, 8), q(0, 11, 15, -7, 0, 24, 38, 3, 0, 9, 46, 8)], Yn = {
  // This is the most common easing curve.
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  // Objects enter the screen at full velocity from off-screen and
  // slowly decelerate to a resting point.
  easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
  // Objects leave the screen at full velocity. They do not decelerate when off-screen.
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  // The sharp curve is used by objects that may return to the screen at any time.
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)"
}, Un = {
  shortest: 150,
  shorter: 200,
  short: 250,
  // most basic recommended timing
  standard: 300,
  // this is to be used in complex animations
  complex: 375,
  // recommended when something is entering screen
  enteringScreen: 225,
  // recommended when something is leaving screen
  leavingScreen: 195
};
function Wr(e) {
  return `${Math.round(e)}ms`;
}
function zn(e) {
  if (!e)
    return 0;
  const r = e / 36;
  return Math.min(Math.round((4 + 15 * r ** 0.25 + r / 5) * 10), 3e3);
}
function Hn(e) {
  const r = {
    ...Yn,
    ...e.easing
  }, t = {
    ...Un,
    ...e.duration
  };
  return {
    getAutoHeightDuration: zn,
    create: (i = ["all"], a = {}) => {
      const {
        duration: c = t.standard,
        easing: l = r.easeInOut,
        delay: f = 0,
        ...d
      } = a;
      if (process.env.NODE_ENV !== "production") {
        const h = (m) => typeof m == "string", p = (m) => !Number.isNaN(parseFloat(m));
        !h(i) && !Array.isArray(i) && console.error('MUI: Argument "props" must be a string or Array.'), !p(c) && !h(c) && console.error(`MUI: Argument "duration" must be a number or a string but found ${c}.`), h(l) || console.error('MUI: Argument "easing" must be a string.'), !p(f) && !h(f) && console.error('MUI: Argument "delay" must be a number or a string.'), typeof a != "object" && console.error(["MUI: Secong argument of transition.create must be an object.", "Arguments should be either `create('prop1', options)` or `create(['prop1', 'prop2'], options)`"].join(`
`)), Object.keys(d).length !== 0 && console.error(`MUI: Unrecognized argument(s) [${Object.keys(d).join(",")}].`);
      }
      return (Array.isArray(i) ? i : [i]).map((h) => `${h} ${typeof c == "string" ? c : Wr(c)} ${l} ${typeof f == "string" ? f : Wr(f)}`).join(",");
    },
    ...e,
    easing: r,
    duration: t
  };
}
const qn = {
  mobileStepper: 1e3,
  fab: 1050,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500
};
function Gn(e) {
  return pe(e) || typeof e > "u" || typeof e == "string" || typeof e == "boolean" || typeof e == "number" || Array.isArray(e);
}
function tt(e = {}) {
  const r = {
    ...e
  };
  function t(n) {
    const i = Object.entries(n);
    for (let a = 0; a < i.length; a++) {
      const [c, l] = i[a];
      !Gn(l) || c.startsWith("unstable_") ? delete n[c] : pe(l) && (n[c] = {
        ...l
      }, t(n[c]));
    }
  }
  return t(r), `import { unstable_createBreakpoints as createBreakpoints, createTransitions } from '@mui/material/styles';

const theme = ${JSON.stringify(r, null, 2)};

theme.breakpoints = createBreakpoints(theme.breakpoints || {});
theme.transitions = createTransitions(theme.transitions || {});

export default theme;`;
}
function Lr(e) {
  return typeof e == "number" ? `${(e * 100).toFixed(0)}%` : `calc((${e}) * 100%)`;
}
const Kn = (e) => {
  if (!Number.isNaN(+e))
    return +e;
  const r = e.match(/\d*\.?\d+/g);
  if (!r)
    return 0;
  let t = 0;
  for (let n = 0; n < r.length; n += 1)
    t += +r[n];
  return t;
};
function Qn(e) {
  Object.assign(e, {
    alpha(r, t) {
      const n = this || e;
      return n.colorSpace ? `oklch(from ${r} l c h / ${typeof t == "string" ? `calc(${t})` : t})` : n.vars ? `rgba(${r.replace(/var\(--([^,\s)]+)(?:,[^)]+)?\)+/g, "var(--$1Channel)")} / ${typeof t == "string" ? `calc(${t})` : t})` : Jr(r, Kn(t));
    },
    lighten(r, t) {
      const n = this || e;
      return n.colorSpace ? `color-mix(in ${n.colorSpace}, ${r}, #fff ${Lr(t)})` : Xe(r, t);
    },
    darken(r, t) {
      const n = this || e;
      return n.colorSpace ? `color-mix(in ${n.colorSpace}, ${r}, #000 ${Lr(t)})` : Qe(r, t);
    }
  });
}
function lr(e = {}, ...r) {
  const {
    breakpoints: t,
    mixins: n = {},
    spacing: i,
    palette: a = {},
    transitions: c = {},
    typography: l = {},
    shape: f,
    colorSpace: d,
    ...h
  } = e;
  if (e.vars && // The error should throw only for the root theme creation because user is not allowed to use a custom node `vars`.
  // `generateThemeVars` is the closest identifier for checking that the `options` is a result of `createTheme` with CSS variables so that user can create new theme for nested ThemeProvider.
  e.generateThemeVars === void 0)
    throw new Error(process.env.NODE_ENV !== "production" ? "MUI: `vars` is a private field used for CSS variables support.\nPlease use another name or follow the [docs](https://mui.com/material-ui/customization/css-theme-variables/usage/) to enable the feature." : me(20));
  const p = mr({
    ...a,
    colorSpace: d
  }), m = pn(e);
  let v = ne(m, {
    mixins: Bn(m.breakpoints, n),
    palette: p,
    // Don't use [...shadows] until you've verified its transpiled code is not invoking the iterator protocol.
    shadows: Vn.slice(),
    typography: Fn(p, l),
    transitions: Hn(c),
    zIndex: {
      ...qn
    }
  });
  if (v = ne(v, h), v = r.reduce((b, s) => ne(b, s), v), process.env.NODE_ENV !== "production") {
    const b = ["active", "checked", "completed", "disabled", "error", "expanded", "focused", "focusVisible", "required", "selected"], s = (C, _) => {
      let B;
      for (B in C) {
        const D = C[B];
        if (b.includes(B) && Object.keys(D).length > 0) {
          if (process.env.NODE_ENV !== "production") {
            const $ = yn("", B);
            console.error([`MUI: The \`${_}\` component increases the CSS specificity of the \`${B}\` internal state.`, "You can not override it like this: ", JSON.stringify(C, null, 2), "", `Instead, you need to use the '&.${$}' syntax:`, JSON.stringify({
              root: {
                [`&.${$}`]: D
              }
            }, null, 2), "", "https://mui.com/r/state-classes-guide"].join(`
`));
          }
          C[B] = {};
        }
      }
    };
    Object.keys(v.components).forEach((C) => {
      const _ = v.components[C].styleOverrides;
      _ && C.startsWith("Mui") && s(_, C);
    });
  }
  return v.unstable_sxConfig = {
    ...qe,
    ...h?.unstable_sxConfig
  }, v.unstable_sx = function(s) {
    return Ge({
      sx: s,
      theme: this
    });
  }, v.toRuntimeSource = tt, Qn(v), v;
}
function Xn(e) {
  let r;
  return e < 1 ? r = 5.11916 * e ** 2 : r = 4.5 * Math.log(e + 1) + 2, Math.round(r * 10) / 1e3;
}
const Jn = [...Array(25)].map((e, r) => {
  if (r === 0)
    return "none";
  const t = Xn(r);
  return `linear-gradient(rgba(255 255 255 / ${t}), rgba(255 255 255 / ${t}))`;
});
function nt(e) {
  return {
    inputPlaceholder: e === "dark" ? 0.5 : 0.42,
    inputUnderline: e === "dark" ? 0.7 : 0.42,
    switchTrackDisabled: e === "dark" ? 0.2 : 0.12,
    switchTrack: e === "dark" ? 0.3 : 0.38
  };
}
function ot(e) {
  return e === "dark" ? Jn : [];
}
function Zn(e) {
  const {
    palette: r = {
      mode: "light"
    },
    // need to cast to avoid module augmentation test
    opacity: t,
    overlays: n,
    colorSpace: i,
    ...a
  } = e, c = mr({
    ...r,
    colorSpace: i
  });
  return {
    palette: c,
    opacity: {
      ...nt(c.mode),
      ...t
    },
    overlays: n || ot(c.mode),
    ...a
  };
}
function eo(e) {
  return !!e[0].match(/(cssVarPrefix|colorSchemeSelector|modularCssLayers|rootSelector|typography|mixins|breakpoints|direction|transitions)/) || !!e[0].match(/sxConfig$/) || // ends with sxConfig
  e[0] === "palette" && !!e[1]?.match(/(mode|contrastThreshold|tonalOffset)/);
}
const ro = (e) => [...[...Array(25)].map((r, t) => `--${e ? `${e}-` : ""}overlays-${t}`), `--${e ? `${e}-` : ""}palette-AppBar-darkBg`, `--${e ? `${e}-` : ""}palette-AppBar-darkColor`], to = (e) => (r, t) => {
  const n = e.rootSelector || ":root", i = e.colorSchemeSelector;
  let a = i;
  if (i === "class" && (a = ".%s"), i === "data" && (a = "[data-%s]"), i?.startsWith("data-") && !i.includes("%s") && (a = `[${i}="%s"]`), e.defaultColorScheme === r) {
    if (r === "dark") {
      const c = {};
      return ro(e.cssVarPrefix).forEach((l) => {
        c[l] = t[l], delete t[l];
      }), a === "media" ? {
        [n]: t,
        "@media (prefers-color-scheme: dark)": {
          [n]: c
        }
      } : a ? {
        [a.replace("%s", r)]: c,
        [`${n}, ${a.replace("%s", r)}`]: t
      } : {
        [n]: {
          ...t,
          ...c
        }
      };
    }
    if (a && a !== "media")
      return `${n}, ${a.replace("%s", String(r))}`;
  } else if (r) {
    if (a === "media")
      return {
        [`@media (prefers-color-scheme: ${String(r)})`]: {
          [n]: t
        }
      };
    if (a)
      return a.replace("%s", String(r));
  }
  return n;
};
function no(e, r) {
  r.forEach((t) => {
    e[t] || (e[t] = {});
  });
}
function u(e, r, t) {
  !e[r] && t && (e[r] = t);
}
function Oe(e) {
  return typeof e != "string" || !e.startsWith("hsl") ? e : Xr(e);
}
function fe(e, r) {
  `${r}Channel` in e || (e[`${r}Channel`] = we(Oe(e[r]), `MUI: Can't create \`palette.${r}Channel\` because \`palette.${r}\` is not one of these formats: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color().
To suppress this warning, you need to explicitly provide the \`palette.${r}Channel\` as a string (in rgb format, for example "12 12 12") or undefined if you want to remove the channel token.`));
}
function oo(e) {
  return typeof e == "number" ? `${e}px` : typeof e == "string" || typeof e == "function" || Array.isArray(e) ? e : "8px";
}
const le = (e) => {
  try {
    return e();
  } catch {
  }
}, io = (e = "mui") => En(e);
function ar(e, r, t, n, i) {
  if (!t)
    return;
  t = t === !0 ? {} : t;
  const a = i === "dark" ? "dark" : "light";
  if (!n) {
    r[i] = Zn({
      ...t,
      palette: {
        mode: a,
        ...t?.palette
      },
      colorSpace: e
    });
    return;
  }
  const {
    palette: c,
    ...l
  } = lr({
    ...n,
    palette: {
      mode: a,
      ...t?.palette
    },
    colorSpace: e
  });
  return r[i] = {
    ...t,
    palette: c,
    opacity: {
      ...nt(a),
      ...t?.opacity
    },
    overlays: t?.overlays || ot(a)
  }, l;
}
function ao(e = {}, ...r) {
  const {
    colorSchemes: t = {
      light: !0
    },
    defaultColorScheme: n,
    disableCssColorScheme: i = !1,
    cssVarPrefix: a = "mui",
    nativeColor: c = !1,
    shouldSkipGeneratingVar: l = eo,
    colorSchemeSelector: f = t.light && t.dark ? "media" : void 0,
    rootSelector: d = ":root",
    ...h
  } = e, p = Object.keys(t)[0], m = n || (t.light && p !== "light" ? "light" : p), v = io(a), {
    [m]: b,
    light: s,
    dark: C,
    ..._
  } = t, B = {
    ..._
  };
  let D = b;
  if ((m === "dark" && !("dark" in t) || m === "light" && !("light" in t)) && (D = !0), !D)
    throw new Error(process.env.NODE_ENV !== "production" ? `MUI: The \`colorSchemes.${m}\` option is either missing or invalid.` : me(21, m));
  let $;
  c && ($ = "oklch");
  const y = ar($, B, D, h, m);
  s && !B.light && ar($, B, s, void 0, "light"), C && !B.dark && ar($, B, C, void 0, "dark");
  let w = {
    defaultColorScheme: m,
    ...y,
    cssVarPrefix: a,
    colorSchemeSelector: f,
    rootSelector: d,
    getCssVar: v,
    colorSchemes: B,
    font: {
      ...Mn(y.typography),
      ...y.font
    },
    spacing: oo(h.spacing)
  };
  Object.keys(w.colorSchemes).forEach((X) => {
    const o = w.colorSchemes[X].palette, x = (F) => {
      const L = F.split("-"), ee = L[1], se = L[2];
      return v(F, o[ee][se]);
    };
    o.mode === "light" && (u(o.common, "background", "#fff"), u(o.common, "onBackground", "#000")), o.mode === "dark" && (u(o.common, "background", "#000"), u(o.common, "onBackground", "#fff"));
    function S(F, L, ee) {
      if ($) {
        let se;
        return F === ye && (se = `transparent ${((1 - ee) * 100).toFixed(0)}%`), F === Y && (se = `#000 ${(ee * 100).toFixed(0)}%`), F === U && (se = `#fff ${(ee * 100).toFixed(0)}%`), `color-mix(in ${$}, ${L}, ${se})`;
      }
      return F(L, ee);
    }
    if (no(o, ["Alert", "AppBar", "Avatar", "Button", "Chip", "FilledInput", "LinearProgress", "Skeleton", "Slider", "SnackbarContent", "SpeedDialAction", "StepConnector", "StepContent", "Switch", "TableCell", "Tooltip"]), o.mode === "light") {
      u(o.Alert, "errorColor", S(Y, o.error.light, 0.6)), u(o.Alert, "infoColor", S(Y, o.info.light, 0.6)), u(o.Alert, "successColor", S(Y, o.success.light, 0.6)), u(o.Alert, "warningColor", S(Y, o.warning.light, 0.6)), u(o.Alert, "errorFilledBg", x("palette-error-main")), u(o.Alert, "infoFilledBg", x("palette-info-main")), u(o.Alert, "successFilledBg", x("palette-success-main")), u(o.Alert, "warningFilledBg", x("palette-warning-main")), u(o.Alert, "errorFilledColor", le(() => o.getContrastText(o.error.main))), u(o.Alert, "infoFilledColor", le(() => o.getContrastText(o.info.main))), u(o.Alert, "successFilledColor", le(() => o.getContrastText(o.success.main))), u(o.Alert, "warningFilledColor", le(() => o.getContrastText(o.warning.main))), u(o.Alert, "errorStandardBg", S(U, o.error.light, 0.9)), u(o.Alert, "infoStandardBg", S(U, o.info.light, 0.9)), u(o.Alert, "successStandardBg", S(U, o.success.light, 0.9)), u(o.Alert, "warningStandardBg", S(U, o.warning.light, 0.9)), u(o.Alert, "errorIconColor", x("palette-error-main")), u(o.Alert, "infoIconColor", x("palette-info-main")), u(o.Alert, "successIconColor", x("palette-success-main")), u(o.Alert, "warningIconColor", x("palette-warning-main")), u(o.AppBar, "defaultBg", x("palette-grey-100")), u(o.Avatar, "defaultBg", x("palette-grey-400")), u(o.Button, "inheritContainedBg", x("palette-grey-300")), u(o.Button, "inheritContainedHoverBg", x("palette-grey-A100")), u(o.Chip, "defaultBorder", x("palette-grey-400")), u(o.Chip, "defaultAvatarColor", x("palette-grey-700")), u(o.Chip, "defaultIconColor", x("palette-grey-700")), u(o.FilledInput, "bg", "rgba(0, 0, 0, 0.06)"), u(o.FilledInput, "hoverBg", "rgba(0, 0, 0, 0.09)"), u(o.FilledInput, "disabledBg", "rgba(0, 0, 0, 0.12)"), u(o.LinearProgress, "primaryBg", S(U, o.primary.main, 0.62)), u(o.LinearProgress, "secondaryBg", S(U, o.secondary.main, 0.62)), u(o.LinearProgress, "errorBg", S(U, o.error.main, 0.62)), u(o.LinearProgress, "infoBg", S(U, o.info.main, 0.62)), u(o.LinearProgress, "successBg", S(U, o.success.main, 0.62)), u(o.LinearProgress, "warningBg", S(U, o.warning.main, 0.62)), u(o.Skeleton, "bg", $ ? S(ye, o.text.primary, 0.11) : `rgba(${x("palette-text-primaryChannel")} / 0.11)`), u(o.Slider, "primaryTrack", S(U, o.primary.main, 0.62)), u(o.Slider, "secondaryTrack", S(U, o.secondary.main, 0.62)), u(o.Slider, "errorTrack", S(U, o.error.main, 0.62)), u(o.Slider, "infoTrack", S(U, o.info.main, 0.62)), u(o.Slider, "successTrack", S(U, o.success.main, 0.62)), u(o.Slider, "warningTrack", S(U, o.warning.main, 0.62));
      const F = $ ? S(Y, o.background.default, 0.6825) : Be(o.background.default, 0.8);
      u(o.SnackbarContent, "bg", F), u(o.SnackbarContent, "color", le(() => $ ? cr.text.primary : o.getContrastText(F))), u(o.SpeedDialAction, "fabHoverBg", Be(o.background.paper, 0.15)), u(o.StepConnector, "border", x("palette-grey-400")), u(o.StepContent, "border", x("palette-grey-400")), u(o.Switch, "defaultColor", x("palette-common-white")), u(o.Switch, "defaultDisabledColor", x("palette-grey-100")), u(o.Switch, "primaryDisabledColor", S(U, o.primary.main, 0.62)), u(o.Switch, "secondaryDisabledColor", S(U, o.secondary.main, 0.62)), u(o.Switch, "errorDisabledColor", S(U, o.error.main, 0.62)), u(o.Switch, "infoDisabledColor", S(U, o.info.main, 0.62)), u(o.Switch, "successDisabledColor", S(U, o.success.main, 0.62)), u(o.Switch, "warningDisabledColor", S(U, o.warning.main, 0.62)), u(o.TableCell, "border", S(U, S(ye, o.divider, 1), 0.88)), u(o.Tooltip, "bg", S(ye, o.grey[700], 0.92));
    }
    if (o.mode === "dark") {
      u(o.Alert, "errorColor", S(U, o.error.light, 0.6)), u(o.Alert, "infoColor", S(U, o.info.light, 0.6)), u(o.Alert, "successColor", S(U, o.success.light, 0.6)), u(o.Alert, "warningColor", S(U, o.warning.light, 0.6)), u(o.Alert, "errorFilledBg", x("palette-error-dark")), u(o.Alert, "infoFilledBg", x("palette-info-dark")), u(o.Alert, "successFilledBg", x("palette-success-dark")), u(o.Alert, "warningFilledBg", x("palette-warning-dark")), u(o.Alert, "errorFilledColor", le(() => o.getContrastText(o.error.dark))), u(o.Alert, "infoFilledColor", le(() => o.getContrastText(o.info.dark))), u(o.Alert, "successFilledColor", le(() => o.getContrastText(o.success.dark))), u(o.Alert, "warningFilledColor", le(() => o.getContrastText(o.warning.dark))), u(o.Alert, "errorStandardBg", S(Y, o.error.light, 0.9)), u(o.Alert, "infoStandardBg", S(Y, o.info.light, 0.9)), u(o.Alert, "successStandardBg", S(Y, o.success.light, 0.9)), u(o.Alert, "warningStandardBg", S(Y, o.warning.light, 0.9)), u(o.Alert, "errorIconColor", x("palette-error-main")), u(o.Alert, "infoIconColor", x("palette-info-main")), u(o.Alert, "successIconColor", x("palette-success-main")), u(o.Alert, "warningIconColor", x("palette-warning-main")), u(o.AppBar, "defaultBg", x("palette-grey-900")), u(o.AppBar, "darkBg", x("palette-background-paper")), u(o.AppBar, "darkColor", x("palette-text-primary")), u(o.Avatar, "defaultBg", x("palette-grey-600")), u(o.Button, "inheritContainedBg", x("palette-grey-800")), u(o.Button, "inheritContainedHoverBg", x("palette-grey-700")), u(o.Chip, "defaultBorder", x("palette-grey-700")), u(o.Chip, "defaultAvatarColor", x("palette-grey-300")), u(o.Chip, "defaultIconColor", x("palette-grey-300")), u(o.FilledInput, "bg", "rgba(255, 255, 255, 0.09)"), u(o.FilledInput, "hoverBg", "rgba(255, 255, 255, 0.13)"), u(o.FilledInput, "disabledBg", "rgba(255, 255, 255, 0.12)"), u(o.LinearProgress, "primaryBg", S(Y, o.primary.main, 0.5)), u(o.LinearProgress, "secondaryBg", S(Y, o.secondary.main, 0.5)), u(o.LinearProgress, "errorBg", S(Y, o.error.main, 0.5)), u(o.LinearProgress, "infoBg", S(Y, o.info.main, 0.5)), u(o.LinearProgress, "successBg", S(Y, o.success.main, 0.5)), u(o.LinearProgress, "warningBg", S(Y, o.warning.main, 0.5)), u(o.Skeleton, "bg", $ ? S(ye, o.text.primary, 0.13) : `rgba(${x("palette-text-primaryChannel")} / 0.13)`), u(o.Slider, "primaryTrack", S(Y, o.primary.main, 0.5)), u(o.Slider, "secondaryTrack", S(Y, o.secondary.main, 0.5)), u(o.Slider, "errorTrack", S(Y, o.error.main, 0.5)), u(o.Slider, "infoTrack", S(Y, o.info.main, 0.5)), u(o.Slider, "successTrack", S(Y, o.success.main, 0.5)), u(o.Slider, "warningTrack", S(Y, o.warning.main, 0.5));
      const F = $ ? S(U, o.background.default, 0.985) : Be(o.background.default, 0.98);
      u(o.SnackbarContent, "bg", F), u(o.SnackbarContent, "color", le(() => $ ? et.text.primary : o.getContrastText(F))), u(o.SpeedDialAction, "fabHoverBg", Be(o.background.paper, 0.15)), u(o.StepConnector, "border", x("palette-grey-600")), u(o.StepContent, "border", x("palette-grey-600")), u(o.Switch, "defaultColor", x("palette-grey-300")), u(o.Switch, "defaultDisabledColor", x("palette-grey-600")), u(o.Switch, "primaryDisabledColor", S(Y, o.primary.main, 0.55)), u(o.Switch, "secondaryDisabledColor", S(Y, o.secondary.main, 0.55)), u(o.Switch, "errorDisabledColor", S(Y, o.error.main, 0.55)), u(o.Switch, "infoDisabledColor", S(Y, o.info.main, 0.55)), u(o.Switch, "successDisabledColor", S(Y, o.success.main, 0.55)), u(o.Switch, "warningDisabledColor", S(Y, o.warning.main, 0.55)), u(o.TableCell, "border", S(Y, S(ye, o.divider, 1), 0.68)), u(o.Tooltip, "bg", S(ye, o.grey[700], 0.92));
    }
    fe(o.background, "default"), fe(o.background, "paper"), fe(o.common, "background"), fe(o.common, "onBackground"), fe(o, "divider"), Object.keys(o).forEach((F) => {
      const L = o[F];
      F !== "tonalOffset" && L && typeof L == "object" && (L.main && u(o[F], "mainChannel", we(Oe(L.main))), L.light && u(o[F], "lightChannel", we(Oe(L.light))), L.dark && u(o[F], "darkChannel", we(Oe(L.dark))), L.contrastText && u(o[F], "contrastTextChannel", we(Oe(L.contrastText))), F === "text" && (fe(o[F], "primary"), fe(o[F], "secondary")), F === "action" && (L.active && fe(o[F], "active"), L.selected && fe(o[F], "selected")));
    });
  }), w = r.reduce((X, o) => ne(X, o), w);
  const ae = {
    prefix: a,
    disableCssColorScheme: i,
    shouldSkipGeneratingVar: l,
    getSelector: to(w),
    enableContrastVars: c
  }, {
    vars: ue,
    generateThemeVars: J,
    generateStyleSheets: Z
  } = xn(w, ae);
  return w.vars = ue, Object.entries(w.colorSchemes[w.defaultColorScheme]).forEach(([X, o]) => {
    w[X] = o;
  }), w.generateThemeVars = J, w.generateStyleSheets = Z, w.generateSpacing = function() {
    return Qr(h.spacing, fr(this));
  }, w.getColorSchemeSelector = wn(f), w.spacing = w.generateSpacing(), w.shouldSkipGeneratingVar = l, w.unstable_sxConfig = {
    ...qe,
    ...h?.unstable_sxConfig
  }, w.unstable_sx = function(o) {
    return Ge({
      sx: o,
      theme: this
    });
  }, w.toRuntimeSource = tt, w;
}
function Vr(e, r, t) {
  e.colorSchemes && t && (e.colorSchemes[r] = {
    ...t !== !0 && t,
    palette: mr({
      ...t === !0 ? {} : t.palette,
      mode: r
    })
    // cast type to skip module augmentation test
  });
}
function so(e = {}, ...r) {
  const {
    palette: t,
    cssVariables: n = !1,
    colorSchemes: i = t ? void 0 : {
      light: !0
    },
    defaultColorScheme: a = t?.mode,
    ...c
  } = e, l = a || "light", f = i?.[l], d = {
    ...i,
    ...t ? {
      [l]: {
        ...typeof f != "boolean" && f,
        palette: t
      }
    } : void 0
  };
  if (n === !1) {
    if (!("colorSchemes" in e))
      return lr(e, ...r);
    let h = t;
    "palette" in e || d[l] && (d[l] !== !0 ? h = d[l].palette : l === "dark" && (h = {
      mode: "dark"
    }));
    const p = lr({
      ...e,
      palette: h
    }, ...r);
    return p.defaultColorScheme = l, p.colorSchemes = d, p.palette.mode === "light" && (p.colorSchemes.light = {
      ...d.light !== !0 && d.light,
      palette: p.palette
    }, Vr(p, "dark", d.dark)), p.palette.mode === "dark" && (p.colorSchemes.dark = {
      ...d.dark !== !0 && d.dark,
      palette: p.palette
    }, Vr(p, "light", d.light)), p;
  }
  return !t && !("light" in d) && l === "light" && (d.light = !0), ao({
    ...c,
    colorSchemes: d,
    defaultColorScheme: l,
    ...typeof n != "boolean" && n
  }, ...r);
}
const lo = so({
  palette: {
    primary: {
      main: "#26A3AB",
      dark: "#07666C",
      contrastText: "#ffffff"
    },
    primaryDark: {
      main: "#07666C",
      light: "#26A3AB",
      dark: "#065C61",
      contrastText: "#ffffff"
    },
    tertiary: {
      main: "#00616F",
      light: "#26A3AB",
      dark: "#005764",
      contrastText: "#ffffff"
    },
    secondary: {
      main: "#D32F2F",
      light: "#ff6659",
      dark: "#9a0007",
      contrastText: "#ffffff"
    },
    warning: {
      main: "#EF6C00"
    },
    background: {
      default: "#F6FCFC",
      paper: "#ffffff"
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: "40px",
      fontWeight: 500,
      lineHeight: 1.167,
      letterSpacing: "-1.5px"
    },
    h2: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: "32px",
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: "-0.5px"
    },
    h3: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: "28px",
      fontWeight: 500,
      lineHeight: 1.25,
      letterSpacing: "0px"
    },
    h4: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: "22px",
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "0.25px"
    },
    h5: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: "20px",
      fontWeight: 700,
      lineHeight: 1.35,
      letterSpacing: "0px"
    },
    h6: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: "20px",
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: "0.15px"
    },
    body1: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif'
    },
    body2: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif'
    },
    button: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontWeight: 500
    },
    subtitle1: {
      fontSize: "16px",
      fontWeight: 600,
      letterSpacing: "0.17px"
    },
    subtitle2: {
      color: "#212121",
      fontSize: "14px",
      fontWeight: 600,
      letterSpacing: "0.17px"
    }
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: ({ theme: e }) => ({
          color: e.palette.primary.main,
          textDecoration: "none",
          fontWeight: 500,
          "&:hover, &:focus-visible": {
            textDecoration: "underline"
          }
        })
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          textTransform: "none",
          fontWeight: 500,
          lineHeight: 1.5
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8
        }
      }
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: ({ theme: e }) => ({
          "& a": {
            color: e.palette.primary.dark,
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline"
            }
          }
        })
      }
    }
  }
});
export {
  $e as P,
  Gr as a,
  so as b,
  pn as c,
  Jr as d,
  Xn as e,
  co as f,
  yn as g,
  pe as i,
  Hr as r,
  Ge as s,
  lo as t
};
