import { Directive, ElementRef, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appInView]'
})
export class InViewDirective implements OnInit, OnDestroy {
  @Output() inView: EventEmitter<boolean> = new EventEmitter<boolean>();
  private observer: IntersectionObserver | undefined;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.inView.emit(entry.isIntersecting);
      },
      {
        threshold: 0.1
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }
}
