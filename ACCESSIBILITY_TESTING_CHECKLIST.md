# Accessibility Testing Checklist

## Quick Reference for WCAG 2.1 Level AA Compliance

---

## 🎯 Before Every Commit

- [ ] **Keyboard Navigation Test** (2 min)
  - Open page in browser
  - Press Tab to navigate all interactive elements
  - Press Shift+Tab to go backwards
  - Verify tab order is logical (top-to-bottom, left-to-right)
  - Ensure no keyboard traps (can always Tab forward/backward)

- [ ] **Focus Indicator Check** (1 min)
  - Tab to each interactive element
  - Verify visible focus outline (should be clearly visible)
  - For form inputs: Should see 2px solid yellow outline
  - For buttons: Should see clear focus state

---

## 🧪 Full Page Accessibility Test (10 min)

### Step 1: Automated Testing with axe DevTools (3 min)

```
1. Open browser DevTools (F12)
2. Install axe DevTools extension (if not installed)
3. Click axe DevTools icon
4. Click "Scan THIS PAGE"
5. Review any violations (red), need fixes
6. Review warnings (yellow), assess impact
7. Screenshot results for documentation
```

**Expected Result:** No violations (red), ideally no warnings

### Step 2: Screen Reader Test - NVDA (3 min)

```
1. Download NVDA (free, Windows): nvaccess.org
2. Start NVDA
3. Open website in browser
4. Press Numpad+1 to scan page
5. Navigate using:
   - Arrow keys: Move through content line by line
   - H: Jump to next heading
   - F: Jump to next form field
   - L: Jump to next list
6. Listen for clear labels on all interactive elements
7. Verify status updates announced (loading, errors)
```

**Expected Result:** Can navigate entire page, all elements labeled

### Step 3: Keyboard Navigation & Focus Order

```
1. Start on page with focus on first element (might need Shift+Alt+T)
2. Press Tab repeatedly through entire page
3. Verify order: Logo → Navigation → Search Form → Buttons → Results
4. Check focus is visible at each stop
5. Confirm Tab+Shift goes backwards
6. Test with Enter on buttons (should activate)
7. Test with Space on buttons (should activate)
```

**Expected Result:** Logical flow, no skipped elements, all buttons clickable

### Step 4: Color Contrast Verification (2 min)

```
1. Use WebAIM Contrast Checker: webaim.org/resources/contrastchecker/
2. Test each color combination on page:
   - White (#fff) on black (#1a1a1a) → Should be 21:1 ✅
   - Yellow (#ffc107) on black (#1a1a1a) → Should be 8.6:1 ✅
   - Light gray (#ccc) on black (#1a1a1a) → Should be 11.36:1 ✅
3. Record any failures
4. For status badges: Verify color + text (not color alone)
```

**Expected Result:** All color combinations meet 4.5:1 minimum

### Step 5: Zoom & Responsive Test (2 min)

```
1. Set browser zoom to 200% (Ctrl/Cmd + "+" twice)
2. Verify layout doesn't break
3. Verify all content still readable
4. Verify all buttons still clickable
5. Test on small screen (320px width)
6. Verify no horizontal scrolling for main content
```

**Expected Result:** Functional at all zoom levels and screen sizes

---

## 📋 Page-Specific Checklists

### Order Status Page (`/store/order-status.html`)

**Search Form Accessibility:**

- [ ] Form labels associated with inputs (click label → input focused)
- [ ] Required field indicators visible and labeled (asterisk has `aria-label="required"`)
- [ ] Input focus states visible (2px yellow outline)
- [ ] Error messages display in alert box (role="alert")
- [ ] Loading state announces to screen readers (aria-live="polite")
- [ ] All inputs reachable by Tab key

**Order Display Accessibility:**

- [ ] Status badge has aria-label for screen readers
- [ ] Status colors verified for sufficient contrast
- [ ] Address and tracking info clearly labeled
- [ ] "Search Another Order" button clearly labeled
- [ ] All content reachable by keyboard (no mouse-only areas)

**Test Data for Validation:**

```
Order ID: PF168865218
Email: sewoolsey@yahoo.com
```

### Product Page (`/store/product.html`)

**Product Information:**

- [ ] Product images have descriptive alt text
- [ ] Product title in H1 tag (exactly one per page)
- [ ] Color/Size options clearly labeled
- [ ] Add to Cart button clearly labeled

**Cart Badge:**

- [ ] Cart badge has aria-label="Items in cart"
- [ ] Badge updates with screen reader announcement when item added
- [ ] Number visible in badge

### Merch Store Index (`/store/index.html`)

**Product Grid:**

- [ ] Each product image has descriptive alt text
- [ ] Product links have clear link text (not "Click Here")
- [ ] Keyboard can navigate entire product grid
- [ ] Filter options clearly labeled
- [ ] Search form follows accessibility guidelines

---

## 🔴 Common Issues to Check

### Issue: Links with no text

```html
❌ BAD:
<a href="/product.html"><img src="product.jpg" /></a>

✅ GOOD:
<a href="/product.html">
  <img src="product.jpg" alt="Product Name" />
</a>
<!-- OR -->
<a href="/product.html" aria-label="View Product Name details">
  <img src="product.jpg" alt="" />
</a>
```

### Issue: Form fields without labels

```html
❌ BAD:
<input type="text" placeholder="Email" />

✅ GOOD:
<label for="email">Email Address</label>
<input type="email" id="email" placeholder="your@example.com" />
```

### Issue: Color-only status indication

```html
❌ BAD:
<div style="background: green">Shipped</div>

✅ GOOD:
<div class="status-shipped" aria-label="Order status: Shipped">
  <span style="background: green; padding: 4px">Shipped</span>
</div>
```

### Issue: Icon buttons without labels

```html
❌ BAD:
<button><i class="fas fa-trash"></i></button>

✅ GOOD:
<button aria-label="Delete item">
  <i class="fas fa-trash" aria-hidden="true"></i>
</button>
```

---

## 🎬 Continuous Testing

### Add to Pre-Commit Hooks

```bash
# Add to .husky/pre-commit:
npx pa11y-ci --runners axe,htmlcs "http://localhost:3000"
```

### Add to Cypress Tests

```javascript
// Add to any .cy.js test:
cy.visit("/store/order-status.html");
cy.injectAxe();
cy.checkA11y();
```

---

## 📞 Getting Help

**WebAIM Resources:**

- Contrast Checker: webaim.org/resources/contrastchecker/
- ARIA Basics: webaim.org/articles/
- Screen Reader Testing: webaim.org/articles/screenreader_testing/

**Axe DevTools Docs:**

- browser.google.com/extensions → search "axe DevTools"
- deque.com/axe/devtools/ for documentation

**WCAG 2.1 Standard:**

- w3.org/WAI/WCAG21/quickref/
- Use the Level AA filter to see requirements

---

## ✅ Completion Checklist

When testing is complete, verify:

- [ ] No red violations in axe DevTools
- [ ] Screen reader can navigate entire page
- [ ] Keyboard Tab order is logical
- [ ] All color combinations meet contrast requirements
- [ ] Page works at 200% zoom
- [ ] Page works on mobile (320px width)
- [ ] Form errors clearly associated with inputs
- [ ] Status updates announced to screen readers
- [ ] No mouse-only functionality

**If any item fails:** Document the issue and create an accessibility ticket before committing code.
