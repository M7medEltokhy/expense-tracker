import { Directive, ElementRef, Input, OnChanges, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appHighlightOverBudget]',
  standalone: true,
})
export class HighlightOverBudgetDirective implements OnChanges {
  private el = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  /** the expense amount to check, passed via the same attribute as the selector */
  @Input('appHighlightOverBudget') amount = 0;

  /** optional threshold above which the element gets flagged, default 100 */
  @Input() threshold = 100;

  ngOnChanges(): void {
    // toggle a class rather than writing inline styles, so the visual
    // treatment stays defined in CSS (design tokens) instead of hard-coded here
    if (this.amount > this.threshold) {
      this.renderer.addClass(this.el.nativeElement, 'over-budget');
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'over-budget');
    }
  }
}
