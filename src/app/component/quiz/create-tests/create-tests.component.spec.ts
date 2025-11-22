import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTestsComponent } from './create-tests.component';

describe('CreateTestsComponent', () => {
  let component: CreateTestsComponent;
  let fixture: ComponentFixture<CreateTestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateTestsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateTestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
